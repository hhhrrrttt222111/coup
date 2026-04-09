import { GameEngine } from '../game/GameEngine';
import { AppError, type GameState, type CardType, ActionType } from '../types';
import PlayerModel from '../models/Player';
import RoomService from '../services/RoomService';
import Room from '../models/Room';

import type {
  TypedServer,
  TypedSocket,
  SerializedGameState,
  SerializedPlayerState,
  JoinRoomPayload,
  StartGamePayload,
  GameActionPayload,
  PlayerResponsePayload,
  BlockChallengePayload,
  LoseInfluencePayload,
  SanitizedPlayer,
} from './socketTypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESPONSE_DEADLINE_MS = 15_000;

// ---------------------------------------------------------------------------
// In-memory game store
// ---------------------------------------------------------------------------

interface RoomSession {
  engine: GameEngine;
  state: GameState;
}

const gameStates = new Map<string, GameState>();
const engines    = new Map<string, GameEngine>();

function getSession(roomCode: string): RoomSession {
  const state  = gameStates.get(roomCode);
  const engine = engines.get(roomCode);
  if (!state || !engine) throw new AppError('No active game', 'NO_ACTIVE_GAME');
  return { engine, state };
}

function saveState(roomCode: string, state: GameState): void {
  gameStates.set(roomCode, state);
}

// Maps socketId → { playerId, roomCode }
const socketRegistry = new Map<string, { playerId: string; playerName: string; roomCode: string }>();

// ---------------------------------------------------------------------------
// Payload validation guards
// ---------------------------------------------------------------------------

function isJoinRoomPayload(p: unknown): p is JoinRoomPayload {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.roomCode === 'string' && o.roomCode.length > 0
      && typeof o.playerName === 'string' && o.playerName.trim().length > 0;
}

function isStartGamePayload(p: unknown): p is StartGamePayload {
  if (typeof p !== 'object' || p === null) return false;
  return typeof (p as Record<string, unknown>).roomCode === 'string';
}

function isGameActionPayload(p: unknown): p is GameActionPayload {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.roomCode === 'string'
      && typeof o.action === 'string'
      && Object.values(ActionType).includes(o.action as ActionType);
}

function isPlayerResponsePayload(p: unknown): p is PlayerResponsePayload {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.roomCode === 'string'
      && typeof o.response === 'string'
      && ['pass', 'block', 'challenge'].includes(o.response as string);
}

function isBlockChallengePayload(p: unknown): p is BlockChallengePayload {
  if (typeof p !== 'object' || p === null) return false;
  return typeof (p as Record<string, unknown>).roomCode === 'string';
}

function isLoseInfluencePayload(p: unknown): p is LoseInfluencePayload {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.roomCode === 'string' && typeof o.cardIndex === 'number';
}

/**
 * Produce a JSON-safe snapshot of GameState for a specific player.
 * Converts Map → plain object and Set → array so Socket.IO can serialize it.
 */
function sanitizeStateFor(state: Readonly<GameState>, playerId: string): SerializedGameState {
  const players: Record<string, SerializedPlayerState> = {};
  for (const [id, ps] of state.players) {
    const isMe = id === playerId;
    players[id] = {
      id: ps.id,
      name: ps.name,
      coins: ps.coins,
      influences: isMe ? [...ps.influences] : [],
      influenceCount: ps.influences.length,
      revealedCards: [...ps.revealedCards],
      isAlive: ps.isAlive,
    };
  }

  return {
    roomId: state.roomId,
    players,
    turnOrder: [...state.turnOrder],
    currentTurnIndex: state.currentTurnIndex,
    deck: [],
    phase: state.phase,
    pendingAction: state.pendingAction ? { ...state.pendingAction } : null,
    pendingBlock: state.pendingBlock ? { ...state.pendingBlock } : null,
    losInfluencePlayerId: state.losInfluencePlayerId,
    exchangeCards:
      state.exchangeCards && playerId === state.turnOrder[state.currentTurnIndex]
        ? [...state.exchangeCards]
        : null,
    respondents: [...state.respondents],
    events: state.events.map((e) => ({ type: e.type, payload: { ...e.payload } })),
    winner: state.winner,
  };
}

// ---------------------------------------------------------------------------
// Broadcast helpers
// ---------------------------------------------------------------------------

function broadcastSanitizedState(
  io: TypedServer,
  roomCode: string,
  state: Readonly<GameState>,
): void {
  io.in(roomCode).fetchSockets().then((sockets) => {
    for (const s of sockets) {
      const reg = socketRegistry.get(s.id);
      if (reg) {
        s.emit('state_update', { state: sanitizeStateFor(state, reg.playerId) });
      }
    }
  }).catch(console.error);
}

function emitError(socket: TypedSocket, err: unknown): void {
  const message = err instanceof Error ? err.message : 'Unknown error';
  const code    = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  socket.emit('error', { message, code });
}

// ---------------------------------------------------------------------------
// Main registration
// ---------------------------------------------------------------------------

export default function registerGameSocket(io: TypedServer): void {
  io.on('connection', (socket: TypedSocket) => {

    // =====================================================================
    // join_room
    // =====================================================================
    socket.on('join_room', async (payload) => {
      try {
        if (!isJoinRoomPayload(payload)) {
          return socket.emit('error', { message: 'Invalid join_room payload', code: 'INVALID_PAYLOAD' });
        }

        const { roomCode, playerName } = payload;

        const room = await RoomService.getRoomByCode(roomCode);
        if (!room) {
          return socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
        }

        // Reuse existing player record on reconnect, or create a new one
        const trimmedName = playerName.trim();
        let dbPlayer = await PlayerModel.findByRoomAndName(room.id, trimmedName);
        if (!dbPlayer) {
          dbPlayer = await PlayerModel.create(room.id, trimmedName);
        }
        await PlayerModel.setSocket(dbPlayer.id, socket.id);

        socket.data.playerId   = dbPlayer.id;
        socket.data.playerName = trimmedName;
        socket.data.roomCode   = roomCode;

        socketRegistry.set(socket.id, {
          playerId: dbPlayer.id,
          playerName: trimmedName,
          roomCode,
        });

        socket.join(roomCode);

        // Build current player list for the room
        const dbPlayers = await PlayerModel.findByRoom(room.id);
        const sanitizedPlayers: SanitizedPlayer[] = dbPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          coins: p.coins,
          influenceCount: 0,
          revealedCards: [],
          isAlive: p.is_alive,
        }));

        socket.emit('room_joined', {
          playerId: dbPlayer.id,
          playerName: trimmedName,
          players: sanitizedPlayers,
          roomCode,
        });

        socket.to(roomCode).emit('player_joined', {
          playerId: dbPlayer.id,
          playerName: trimmedName,
          players: sanitizedPlayers,
        });
      } catch (err) {
        emitError(socket, err);
      }
    });

    // =====================================================================
    // start_game
    // =====================================================================
    socket.on('start_game', async (payload) => {
      try {
        if (!isStartGamePayload(payload)) {
          return socket.emit('error', { message: 'Invalid start_game payload', code: 'INVALID_PAYLOAD' });
        }

        const { roomCode } = payload;

        const room = await RoomService.getRoomByCode(roomCode);
        if (!room) {
          return socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
        }

        const dbPlayers = await PlayerModel.findByRoom(room.id);
        if (dbPlayers.length < 2) {
          return socket.emit('error', { message: 'Need at least 2 players to start', code: 'INSUFFICIENT_PLAYERS' });
        }

        const playerIds = dbPlayers.map((p) => p.id);
        const names = new Map(dbPlayers.map((p) => [p.id, p.name]));

        const engine = new GameEngine(roomCode);
        const state  = engine.initGame(playerIds, names);

        engines.set(roomCode, engine);
        saveState(roomCode, state);

        await Room.updateStatus(room.id, 'in_progress');

        // Send per-player sanitised initial state
        const sockets = await io.in(roomCode).fetchSockets();
        for (const s of sockets) {
          const reg = socketRegistry.get(s.id);
          if (reg) {
            s.emit('game_started', { state: sanitizeStateFor(state, reg.playerId) });
          }
        }
      } catch (err) {
        emitError(socket, err);
      }
    });

    // =====================================================================
    // game_action
    // =====================================================================
    socket.on('game_action', (payload) => {
      try {
        if (!isGameActionPayload(payload)) {
          return socket.emit('error', { message: 'Invalid game_action payload', code: 'INVALID_PAYLOAD' });
        }

        const { roomCode, action, targetId } = payload;
        const { engine, state } = getSession(roomCode);
        const playerId = socket.data.playerId;
        if (!playerId) {
          return socket.emit('error', { message: 'Not joined to a room', code: 'NOT_JOINED' });
        }

        const currentPlayerId = state.turnOrder[state.currentTurnIndex];
        if (playerId !== currentPlayerId) {
          return socket.emit('error', { message: 'Not your turn', code: 'NOT_YOUR_TURN' });
        }

        console.log(`[game_action] player=${playerId} action=${action} target=${targetId ?? 'none'} phase=${state.phase}`);

        const newState = engine.processAction(state, action as ActionType, playerId, targetId);
        saveState(roomCode, newState);

        console.log(`[game_action] → newPhase=${newState.phase}`);

        // If the action moved into a response phase, broadcast await_response
        if (
          newState.phase === 'challenge_action' ||
          newState.phase === 'block'
        ) {
          const pending = newState.pendingAction!;
          io.in(roomCode).emit('await_response', {
            phase: newState.phase,
            actorId: pending.actorId,
            action: pending.action,
            targetId: pending.targetId,
            claimedCard: pending.claimedCard,
            deadline: Date.now() + RESPONSE_DEADLINE_MS,
          });

          // Auto-resolve after deadline if nobody responds
          const snapshot = newState;
          setTimeout(() => {
            const current = gameStates.get(roomCode);
            // Only fire if state hasn't changed (no one responded yet)
            if (current === snapshot) {
              try {
                // Simulate all alive non-actor players passing
                let resolved = current;
                const alive = resolved.turnOrder.filter(
                  (id) => id !== pending.actorId && resolved.players.get(id)?.isAlive,
                );
                for (const id of alive) {
                  if (!resolved.respondents.has(id)) {
                    resolved = engine.processResponse(resolved, id, 'pass');
                  }
                }
                saveState(roomCode, resolved);
                broadcastSanitizedState(io, roomCode, resolved);

                if (resolved.phase === 'game_over' && resolved.winner) {
                  emitGameOver(io, roomCode, resolved);
                }
              } catch (e) {
                console.error('Auto-resolve deadline error:', e);
              }
            }
          }, RESPONSE_DEADLINE_MS);

          // Also send sanitised state
          broadcastSanitizedState(io, roomCode, newState);
          return;
        }

        // If lose_influence phase, tell the target to pick a card
        if (newState.phase === 'lose_influence') {
          broadcastSanitizedState(io, roomCode, newState);
          return;
        }

        // Check for winner after immediate resolution
        if (newState.phase === 'game_over' && newState.winner) {
          broadcastSanitizedState(io, roomCode, newState);
          emitGameOver(io, roomCode, newState);
          return;
        }

        broadcastSanitizedState(io, roomCode, newState);
      } catch (err) {
        emitError(socket, err);
      }
    });

    // =====================================================================
    // player_response (pass / block / challenge)
    // =====================================================================
    socket.on('player_response', (payload) => {
      try {
        if (!isPlayerResponsePayload(payload)) {
          return socket.emit('error', { message: 'Invalid player_response payload', code: 'INVALID_PAYLOAD' });
        }

        const { roomCode, response, blockCard } = payload;
        const { engine, state } = getSession(roomCode);
        const playerId = socket.data.playerId;
        if (!playerId) {
          return socket.emit('error', { message: 'Not joined to a room', code: 'NOT_JOINED' });
        }

        console.log(`[player_response] player=${playerId} response=${response} blockCard=${blockCard ?? 'none'} phase=${state.phase}`);

        const newState = engine.processResponse(state, playerId, response, blockCard);
        saveState(roomCode, newState);

        console.log(`[player_response] → newPhase=${newState.phase}`);

        // ── Challenge happened ──────────────────────────────────────────
        if (response === 'challenge') {
          const lastEvent = [...newState.events].reverse().find(
            (e) => e.type === 'challenge_succeeded' || e.type === 'challenge_failed',
          );
          if (lastEvent) {
            const p = lastEvent.payload as Record<string, unknown>;
            io.in(roomCode).emit('challenge_result', {
              challengerId: p.challengerId as string,
              challengedId: p.challengedId as string,
              challengerWon: lastEvent.type === 'challenge_succeeded',
              loserPlayerId: p.loserPlayerId as string,
              cardRevealed: p.cardRevealed as CardType,
            });
          }

          // Challenge failed and action is blockable → moved to block phase.
          // Emit await_response so the frontend shows the block/pass UI.
          if (newState.phase === 'block' && newState.pendingAction) {
            const pending = newState.pendingAction;
            io.in(roomCode).emit('await_response', {
              phase: newState.phase,
              actorId: pending.actorId,
              action: pending.action,
              targetId: pending.targetId,
              claimedCard: pending.claimedCard,
              deadline: Date.now() + RESPONSE_DEADLINE_MS,
            });

            const snapshot = newState;
            setTimeout(() => {
              const current = gameStates.get(roomCode);
              if (current === snapshot) {
                try {
                  let resolved = current;
                  const alive = resolved.turnOrder.filter(
                    (id) => id !== pending.actorId && resolved.players.get(id)?.isAlive,
                  );
                  for (const id of alive) {
                    if (!resolved.respondents.has(id)) {
                      resolved = engine.processResponse(resolved, id, 'pass');
                    }
                  }
                  saveState(roomCode, resolved);
                  broadcastSanitizedState(io, roomCode, resolved);

                  if (resolved.phase === 'game_over' && resolved.winner) {
                    emitGameOver(io, roomCode, resolved);
                  }
                } catch (e) {
                  console.error('Block-after-challenge deadline auto-resolve error:', e);
                }
              }
            }, RESPONSE_DEADLINE_MS);
          }
        }

        // ── Block declared ──────────────────────────────────────────────
        if (response === 'block' && newState.phase === 'challenge_block') {
          const block = newState.pendingBlock!;
          const pending = newState.pendingAction!;
          io.in(roomCode).emit('block_declared', {
            blockerId: block.blockerId,
            claimedCard: block.claimedCard,
            action: pending.action,
            deadline: Date.now() + RESPONSE_DEADLINE_MS,
          });

          // Auto-accept block after deadline
          const snapshot = newState;
          setTimeout(() => {
            const current = gameStates.get(roomCode);
            if (current === snapshot && current.phase === 'challenge_block') {
              try {
                // Actor didn't challenge the block — block stands, action cancelled
                const resolved: GameState = {
                  ...current,
                  phase: 'action',
                  pendingAction: null,
                  pendingBlock: null,
                  // Advance turn
                  currentTurnIndex: (() => {
                    let idx = current.currentTurnIndex;
                    do {
                      idx = (idx + 1) % current.turnOrder.length;
                    } while (!current.players.get(current.turnOrder[idx])?.isAlive);
                    return idx;
                  })(),
                };
                saveState(roomCode, resolved);
                broadcastSanitizedState(io, roomCode, resolved);
              } catch (e) {
                console.error('Block deadline auto-resolve error:', e);
              }
            }
          }, RESPONSE_DEADLINE_MS);
        }

        // ── influence_lost event ────────────────────────────────────────
        const lostEvent = [...newState.events].reverse().find(
          (e) => e.type === 'influence_lost',
        );
        if (lostEvent) {
          const p = lostEvent.payload as Record<string, unknown>;
          io.in(roomCode).emit('influence_lost', {
            playerId: p.playerId as string,
            card: p.card as CardType,
            isAlive: p.isAlive as boolean,
          });
        }

        // ── game_over ───────────────────────────────────────────────────
        if (newState.phase === 'game_over' && newState.winner) {
          broadcastSanitizedState(io, roomCode, newState);
          emitGameOver(io, roomCode, newState);
          return;
        }

        broadcastSanitizedState(io, roomCode, newState);
      } catch (err) {
        emitError(socket, err);
      }
    });

    // =====================================================================
    // block_challenge — actor challenges the blocker
    // =====================================================================
    socket.on('block_challenge', (payload) => {
      try {
        if (!isBlockChallengePayload(payload)) {
          return socket.emit('error', { message: 'Invalid block_challenge payload', code: 'INVALID_PAYLOAD' });
        }

        const { roomCode } = payload;
        const { engine, state } = getSession(roomCode);
        const playerId = socket.data.playerId;
        if (!playerId) {
          return socket.emit('error', { message: 'Not joined to a room', code: 'NOT_JOINED' });
        }

        const newState = engine.processBlockChallenge(state, playerId);
        saveState(roomCode, newState);

        // Emit challenge result
        const lastEvent = [...newState.events].reverse().find(
          (e) => e.type === 'challenge_succeeded' || e.type === 'challenge_failed',
        );
        if (lastEvent) {
          const p = lastEvent.payload as Record<string, unknown>;
          io.in(roomCode).emit('block_challenge_result', {
            challengerId: p.challengerId as string,
            blockerId: p.challengedId as string,
            challengerWon: lastEvent.type === 'challenge_succeeded',
            loserPlayerId: p.loserPlayerId as string,
            cardRevealed: p.cardRevealed as CardType,
          });
        }

        // Influence lost
        const lostEvent = [...newState.events].reverse().find(
          (e) => e.type === 'influence_lost',
        );
        if (lostEvent) {
          const p = lostEvent.payload as Record<string, unknown>;
          io.in(roomCode).emit('influence_lost', {
            playerId: p.playerId as string,
            card: p.card as CardType,
            isAlive: p.isAlive as boolean,
          });
        }

        if (newState.phase === 'game_over' && newState.winner) {
          broadcastSanitizedState(io, roomCode, newState);
          emitGameOver(io, roomCode, newState);
          return;
        }

        broadcastSanitizedState(io, roomCode, newState);
      } catch (err) {
        emitError(socket, err);
      }
    });

    // =====================================================================
    // lose_influence — player picks which card to reveal
    // =====================================================================
    socket.on('lose_influence', (payload) => {
      try {
        if (!isLoseInfluencePayload(payload)) {
          return socket.emit('error', { message: 'Invalid lose_influence payload', code: 'INVALID_PAYLOAD' });
        }

        const { roomCode, cardIndex } = payload;
        const { engine, state } = getSession(roomCode);
        const playerId = socket.data.playerId;
        if (!playerId) {
          return socket.emit('error', { message: 'Not joined to a room', code: 'NOT_JOINED' });
        }

        const newState = engine.processLoseInfluence(state, playerId, cardIndex);
        saveState(roomCode, newState);

        const lostEvent = [...newState.events].reverse().find(
          (e) => e.type === 'influence_lost',
        );
        if (lostEvent) {
          const p = lostEvent.payload as Record<string, unknown>;
          io.in(roomCode).emit('influence_lost', {
            playerId: p.playerId as string,
            card: p.card as CardType,
            isAlive: p.isAlive as boolean,
          });
        }

        if (newState.phase === 'game_over' && newState.winner) {
          broadcastSanitizedState(io, roomCode, newState);
          emitGameOver(io, roomCode, newState);
          return;
        }

        broadcastSanitizedState(io, roomCode, newState);
      } catch (err) {
        emitError(socket, err);
      }
    });

    // =====================================================================
    // exchange_select — player picks cards to keep after Ambassador exchange
    // =====================================================================
    socket.on('exchange_select', (payload) => {
      try {
        const roomCode = payload?.roomCode;
        const selectedCards = payload?.selectedCards;
        if (typeof roomCode !== 'string' || !Array.isArray(selectedCards)) {
          return socket.emit('error', { message: 'Invalid exchange_select payload', code: 'INVALID_PAYLOAD' });
        }

        const { engine, state } = getSession(roomCode);
        const playerId = socket.data.playerId;
        if (!playerId) {
          return socket.emit('error', { message: 'Not joined to a room', code: 'NOT_JOINED' });
        }

        console.log(`[exchange_select] player=${playerId} selected=${JSON.stringify(selectedCards)}`);

        const newState = engine.processExchangeReturn(state, playerId, selectedCards as CardType[]);
        saveState(roomCode, newState);

        broadcastSanitizedState(io, roomCode, newState);
      } catch (err) {
        console.error('[exchange_select] error:', err);
        emitError(socket, err);
      }
    });

    // =====================================================================
    // restart_game — return all players to lobby for another round
    // =====================================================================
    socket.on('restart_game', async (payload) => {
      try {
        const roomCode = payload?.roomCode;
        if (typeof roomCode !== 'string') {
          return socket.emit('error', { message: 'Invalid restart payload', code: 'INVALID_PAYLOAD' });
        }

        gameStates.delete(roomCode);
        engines.delete(roomCode);

        const room = await RoomService.getRoomByCode(roomCode);
        if (!room) {
          return socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
        }

        await Room.updateStatus(room.id, 'waiting');

        const dbPlayers = await PlayerModel.findByRoom(room.id);
        const sanitizedPlayers: SanitizedPlayer[] = dbPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          coins: p.coins,
          influenceCount: 0,
          revealedCards: [],
          isAlive: p.is_alive,
        }));

        io.in(roomCode).emit('game_restarted', { players: sanitizedPlayers });
      } catch (err) {
        emitError(socket, err);
      }
    });

    // =====================================================================
    // disconnect
    // =====================================================================
    socket.on('disconnect', async () => {
      const reg = socketRegistry.get(socket.id);
      if (!reg) return;

      const { playerId, playerName, roomCode } = reg;
      socketRegistry.delete(socket.id);

      try {
        socket.to(roomCode).emit('player_disconnected', { playerId, playerName });

        // Only tear down the game if no other sockets remain in the room
        const remaining = await io.in(roomCode).fetchSockets();
        if (remaining.length === 0) {
          gameStates.delete(roomCode);
          engines.delete(roomCode);

          const room = await RoomService.getRoomByCode(roomCode);
          if (room) {
            await Room.updateStatus(room.id, 'abandoned');
          }
        }
      } catch (err) {
        console.error('Disconnect cleanup error:', err);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emitGameOver(
  io: TypedServer,
  roomCode: string,
  state: Readonly<GameState>,
): void {
  const winnerId = state.winner;
  if (!winnerId) return;
  const winner = state.players.get(winnerId);
  io.in(roomCode).emit('game_over', {
    winnerId,
    winnerName: winner?.name ?? 'Unknown',
  });

  // Clean up in-memory state
  gameStates.delete(roomCode);
  engines.delete(roomCode);
}
