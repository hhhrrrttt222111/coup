import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { useSocket } from './SocketContext';
import { storeSession, clearSession } from '../types/session';
import type {
  GameState,
  GameLogEntry,
  GamePhase,
  PlayerState,
  SanitizedPlayer,
  CardType,
  RoomJoinedPayload,
  PlayerJoinedPayload,
  GameStartedPayload,
  StateUpdatePayload,
  AwaitResponsePayload,
  ChallengeResultPayload,
  BlockDeclaredPayload,
  BlockChallengeResultPayload,
  InfluenceLostPayload,
  PlayerDisconnectedPayload,
  GameOverPayload,
  GameRestartedPayload,
  ErrorPayload,
} from '../types';

// ---------------------------------------------------------------------------
// Client-side game state
// ---------------------------------------------------------------------------

export interface ClientGameState {
  readonly roomCode: string | null;
  readonly myPlayerId: string | null;
  readonly myCards: readonly CardType[];
  readonly gameState: GameState | null;
  readonly phase: GamePhase;
  readonly lobbyPlayers: readonly SanitizedPlayer[];
  readonly log: readonly GameLogEntry[];
  readonly awaitingResponse: AwaitResponsePayload | null;
  readonly lastError: ErrorPayload | null;
  readonly winner: GameOverPayload | null;
  readonly disconnectedPlayer: PlayerDisconnectedPayload | null;
}

const initialState: ClientGameState = {
  roomCode: null,
  myPlayerId: null,
  myCards: [],
  gameState: null,
  phase: 'lobby',
  lobbyPlayers: [],
  log: [],
  awaitingResponse: null,
  lastError: null,
  winner: null,
  disconnectedPlayer: null,
};

// ---------------------------------------------------------------------------
// Discriminated union of actions
// ---------------------------------------------------------------------------

export type GameAction =
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'ROOM_JOINED'; payload: RoomJoinedPayload }
  | { type: 'PLAYER_JOINED'; payload: PlayerJoinedPayload }
  | { type: 'GAME_STARTED'; payload: GameStartedPayload }
  | { type: 'STATE_UPDATE'; payload: StateUpdatePayload }
  | { type: 'AWAIT_RESPONSE'; payload: AwaitResponsePayload }
  | { type: 'CHALLENGE_RESULT'; payload: ChallengeResultPayload }
  | { type: 'BLOCK_DECLARED'; payload: BlockDeclaredPayload }
  | { type: 'BLOCK_CHALLENGE_RESULT'; payload: BlockChallengeResultPayload }
  | { type: 'INFLUENCE_LOST'; payload: InfluenceLostPayload }
  | { type: 'PLAYER_DISCONNECTED'; payload: PlayerDisconnectedPayload }
  | { type: 'GAME_OVER'; payload: GameOverPayload }
  | { type: 'GAME_RESTARTED'; payload: GameRestartedPayload }
  | { type: 'ERROR'; payload: ErrorPayload }
  | { type: 'SET_LOG'; payload: GameLogEntry[] }
  | { type: 'CLEAR_DISCONNECT' }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function gameReducer(state: ClientGameState, action: GameAction): ClientGameState {
  switch (action.type) {
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload };

    case 'ROOM_JOINED': {
      const { playerId, roomCode, players, playerName } = action.payload;
      storeSession({ playerId, playerName, roomCode });
      return {
        ...state,
        roomCode,
        myPlayerId: playerId,
        lobbyPlayers: players,
        phase: 'lobby',
        lastError: null,
      };
    }

    case 'PLAYER_JOINED':
      return { ...state, lobbyPlayers: action.payload.players };

    case 'GAME_STARTED': {
      const gs = action.payload.state;
      const myCards = extractMyCards(gs, state.myPlayerId);
      return { ...state, gameState: gs, phase: gs.phase, myCards, awaitingResponse: null, winner: null };
    }

    case 'STATE_UPDATE': {
      const gs = action.payload.state;
      const myCards = extractMyCards(gs, state.myPlayerId);
      const clearAwaiting =
        gs.phase === 'action' || gs.phase === 'exchange_return' || gs.phase === 'lose_influence' || gs.phase === 'game_over';
      return {
        ...state,
        gameState: gs,
        phase: gs.phase,
        myCards,
        ...(clearAwaiting ? { awaitingResponse: null } : {}),
      };
    }

    case 'AWAIT_RESPONSE':
      return { ...state, awaitingResponse: action.payload };

    case 'CHALLENGE_RESULT':
      return { ...state, awaitingResponse: null };

    case 'BLOCK_DECLARED':
      return { ...state, awaitingResponse: null };

    case 'BLOCK_CHALLENGE_RESULT':
      return state;

    case 'INFLUENCE_LOST':
      return state;

    case 'PLAYER_DISCONNECTED':
      return { ...state, disconnectedPlayer: action.payload };

    case 'GAME_OVER':
      return { ...state, phase: 'game_over', winner: action.payload, awaitingResponse: null };

    case 'GAME_RESTARTED':
      return {
        ...state,
        phase: 'lobby',
        gameState: null,
        myCards: [],
        lobbyPlayers: action.payload.players,
        awaitingResponse: null,
        winner: null,
        lastError: null,
        log: [],
      };

    case 'ERROR':
      return { ...state, lastError: action.payload };

    case 'SET_LOG':
      return { ...state, log: action.payload };

    case 'CLEAR_DISCONNECT':
      return { ...state, disconnectedPlayer: null };

    case 'RESET': {
      clearSession();
      return initialState;
    }

    default:
      return state;
  }
}

function extractMyCards(gs: GameState, myPlayerId: string | null): readonly CardType[] {
  if (!myPlayerId) return [];
  const me = gs.players[myPlayerId];
  return me?.influences ?? [];
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function isMyTurn(state: ClientGameState): boolean {
  const gs = state.gameState;
  if (!gs || !state.myPlayerId) return false;
  return gs.turnOrder[gs.currentTurnIndex] === state.myPlayerId;
}

export function getMyPlayer(state: ClientGameState): PlayerState | undefined {
  if (!state.gameState || !state.myPlayerId) return undefined;
  return state.gameState.players[state.myPlayerId];
}

export function getAlivePlayers(state: ClientGameState): PlayerState[] {
  if (!state.gameState) return [];
  return Object.values(state.gameState.players).filter((p) => p.isAlive);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface GameContextValue {
  state: ClientGameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider — wires socket events to dispatch
// ---------------------------------------------------------------------------

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      room_joined:            (p: RoomJoinedPayload) => dispatch({ type: 'ROOM_JOINED', payload: p }),
      player_joined:          (p: PlayerJoinedPayload) => dispatch({ type: 'PLAYER_JOINED', payload: p }),
      game_started:           (p: GameStartedPayload) => dispatch({ type: 'GAME_STARTED', payload: p }),
      state_update:           (p: StateUpdatePayload) => dispatch({ type: 'STATE_UPDATE', payload: p }),
      await_response:         (p: AwaitResponsePayload) => dispatch({ type: 'AWAIT_RESPONSE', payload: p }),
      challenge_result:       (p: ChallengeResultPayload) => dispatch({ type: 'CHALLENGE_RESULT', payload: p }),
      block_declared:         (p: BlockDeclaredPayload) => dispatch({ type: 'BLOCK_DECLARED', payload: p }),
      block_challenge_result: (p: BlockChallengeResultPayload) => dispatch({ type: 'BLOCK_CHALLENGE_RESULT', payload: p }),
      influence_lost:         (p: InfluenceLostPayload) => dispatch({ type: 'INFLUENCE_LOST', payload: p }),
      player_disconnected:    (p: PlayerDisconnectedPayload) => dispatch({ type: 'PLAYER_DISCONNECTED', payload: p }),
      game_over:              (p: GameOverPayload) => dispatch({ type: 'GAME_OVER', payload: p }),
      game_restarted:         (p: GameRestartedPayload) => dispatch({ type: 'GAME_RESTARTED', payload: p }),
      error:                  (p: ErrorPayload) => dispatch({ type: 'ERROR', payload: p }),
    } as const;

    (Object.keys(handlers) as (keyof typeof handlers)[]).forEach((event) => {
      socket.on(event, handlers[event] as (...args: unknown[]) => void);
    });

    return () => {
      (Object.keys(handlers) as (keyof typeof handlers)[]).forEach((event) => {
        socket.off(event, handlers[event] as (...args: unknown[]) => void);
      });
    };
  }, [socket]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a <GameProvider>');
  }
  return ctx;
}
