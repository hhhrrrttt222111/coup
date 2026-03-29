import {
  ActionType,
  AppError,
  type CardType,
  type GameState,
  type GameEvent,
  type PlayerState,
  type PendingAction,
} from '../types';
import { buildDeck, shuffleDeck, dealCards } from './DeckManager';
import { resolveAction, getClaimedCard } from './ActionResolver';
import { canChallenge, resolveChallenge } from './ChallengeHandler';
import { canBlock, getBlockingCards, resolveBlock } from './BlockHandler';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COINS_START = 2;

// ---------------------------------------------------------------------------
// Internal helpers (pure)
// ---------------------------------------------------------------------------

function getPlayer(state: Readonly<GameState>, id: string): Readonly<PlayerState> {
  const p = state.players.get(id);
  if (!p) throw new AppError(`Player ${id} not found`, 'PLAYER_NOT_FOUND');
  return p;
}

function updatePlayer(
  state: Readonly<GameState>,
  id: string,
  patch: Partial<PlayerState>,
): GameState {
  const prev = getPlayer(state, id);
  const updated: PlayerState = { ...prev, ...patch };
  const players = new Map(state.players);
  players.set(id, Object.freeze(updated));
  return { ...state, players };
}

function appendEvents(state: Readonly<GameState>, events: readonly GameEvent[]): GameState {
  return { ...state, events: [...state.events, ...events] };
}

function advanceTurn(state: Readonly<GameState>): GameState {
  const alive = state.turnOrder.filter((id) => {
    const p = state.players.get(id);
    return p?.isAlive;
  });
  if (alive.length <= 1) return state;

  let idx = state.currentTurnIndex;
  do {
    idx = (idx + 1) % state.turnOrder.length;
  } while (!state.players.get(state.turnOrder[idx])?.isAlive);

  return { ...state, currentTurnIndex: idx };
}

/**
 * After losing influence check if the player is eliminated and if there is
 * now a single player left (winner).
 */
function postInfluenceLoss(state: Readonly<GameState>): GameState {
  const alive = state.turnOrder.filter((id) => state.players.get(id)?.isAlive);
  if (alive.length === 1) {
    return {
      ...state,
      phase: 'game_over',
      winner: alive[0],
      events: [...state.events, { type: 'game_over', payload: { winner: alive[0] } }],
    };
  }
  return state;
}

// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------

export class GameEngine {
  public readonly roomId: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  // -----------------------------------------------------------------------
  // initGame
  // -----------------------------------------------------------------------

  initGame(playerIds: readonly string[], names: ReadonlyMap<string, string>): Readonly<GameState> {
    if (playerIds.length < 2 || playerIds.length > 6) {
      throw new AppError('Game requires 2–6 players', 'INVALID_PLAYER_COUNT');
    }

    const deck = shuffleDeck(buildDeck());
    const { hands, remainingDeck } = dealCards(deck, playerIds);

    const players = new Map<string, PlayerState>();
    for (const id of playerIds) {
      const hand = hands.get(id) ?? [];
      players.set(id, Object.freeze({
        id,
        name: names.get(id) ?? id,
        coins: COINS_START,
        influences: hand,
        revealedCards: [],
        isAlive: true,
      }));
    }

    const state: GameState = {
      roomId: this.roomId,
      players,
      turnOrder: [...playerIds],
      currentTurnIndex: 0,
      deck: remainingDeck,
      phase: 'action',
      pendingAction: null,
      pendingBlock: null,
      losInfluencePlayerId: null,
      exchangeCards: null,
      respondents: new Set(),
      events: [{ type: 'game_started', payload: { playerIds: [...playerIds] } }],
      winner: null,
    };

    return state;
  }

  // -----------------------------------------------------------------------
  // processAction — player declares an action on their turn
  // -----------------------------------------------------------------------

  processAction(
    gameState: Readonly<GameState>,
    action: ActionType,
    actorId: string,
    targetId?: string,
  ): Readonly<GameState> {
    if (gameState.phase !== 'action') {
      throw new AppError('Not in action phase', 'WRONG_PHASE');
    }

    const currentPlayerId = gameState.turnOrder[gameState.currentTurnIndex];
    if (actorId !== currentPlayerId) {
      throw new AppError('Not your turn', 'NOT_YOUR_TURN');
    }

    // ── Income & Coup resolve immediately (cannot be challenged/blocked) ─
    if (action === ActionType.INCOME) {
      const { newState } = resolveAction(gameState, action, actorId);
      return advanceTurn({ ...newState, phase: 'action', pendingAction: null });
    }

    if (action === ActionType.COUP) {
      const { newState } = resolveAction(gameState, action, actorId, targetId);
      return {
        ...newState,
        phase: 'lose_influence',
        losInfluencePlayerId: targetId!,
        pendingAction: null,
      };
    }

    // ── All other actions go through a response window ───────────────────
    const claimedCard = getClaimedCard(action);
    const pending: PendingAction = { action, actorId, targetId, claimedCard };

    const challengeable = canChallenge(action);
    const blockable     = canBlock(action);

    let nextPhase: GameState['phase'];
    if (challengeable) {
      nextPhase = 'challenge_action';
    } else if (blockable) {
      nextPhase = 'block';
    } else {
      // Foreign Aid is blockable but not challengeable — goes to block phase
      nextPhase = 'block';
    }

    const events: GameEvent[] = [{
      type: 'action_declared',
      payload: { actorId, action, targetId, claimedCard },
    }];

    return appendEvents(
      { ...gameState, pendingAction: pending, phase: nextPhase, respondents: new Set() },
      events,
    );
  }

  // -----------------------------------------------------------------------
  // processResponse — another player responds to a pending action
  // -----------------------------------------------------------------------

  processResponse(
    gameState: Readonly<GameState>,
    responder: string,
    response: 'pass' | 'block' | 'challenge',
    blockCard?: CardType,
  ): Readonly<GameState> {
    const pending = gameState.pendingAction;
    if (!pending) throw new AppError('No pending action', 'NO_PENDING_ACTION');

    if (responder === pending.actorId) {
      throw new AppError('Actor cannot respond to their own action', 'INVALID_RESPONDER');
    }

    // ── PASS ─────────────────────────────────────────────────────────────
    if (response === 'pass') {
      const respondents = new Set(gameState.respondents);
      respondents.add(responder);

      // Check if all other alive players have passed
      const alive = gameState.turnOrder.filter((id) =>
        id !== pending.actorId && gameState.players.get(id)?.isAlive,
      );
      const allPassed = alive.every((id) => respondents.has(id));

      if (allPassed) {
        return this.finaliseAction({ ...gameState, respondents });
      }

      return { ...gameState, respondents };
    }

    // ── CHALLENGE ────────────────────────────────────────────────────────
    if (response === 'challenge') {
      if (gameState.phase !== 'challenge_action') {
        throw new AppError('Cannot challenge in this phase', 'WRONG_PHASE');
      }
      if (!pending.claimedCard) {
        throw new AppError('This action cannot be challenged', 'NOT_CHALLENGEABLE');
      }

      const result = resolveChallenge({
        challengerId: responder,
        challengedId: pending.actorId,
        claimedCard: pending.claimedCard,
        gameState,
      });

      let state = result.updatedState;

      if (result.challengerWon) {
        // Action is cancelled; if assassinate, coins already deducted in
        // processAction path — but we haven't resolved yet, so no refund.
        state = advanceTurn({ ...state, phase: 'action', pendingAction: null, pendingBlock: null });
        return postInfluenceLoss(state);
      }

      // Challenge failed — action still proceeds.
      // If the action is also blockable, move to block phase for remaining players.
      state = postInfluenceLoss(state);
      if (state.phase === 'game_over') return state;

      if (canBlock(pending.action)) {
        return { ...state, phase: 'block', respondents: new Set() };
      }

      return this.finaliseAction(state);
    }

    // ── BLOCK ────────────────────────────────────────────────────────────
    if (response === 'block') {
      if (gameState.phase !== 'block' && gameState.phase !== 'challenge_action') {
        throw new AppError('Cannot block in this phase', 'WRONG_PHASE');
      }
      if (!blockCard) {
        throw new AppError('Must specify a blocking card', 'MISSING_BLOCK_CARD');
      }
      const validBlockers = getBlockingCards(pending.action);
      if (!validBlockers.includes(blockCard)) {
        throw new AppError(`${blockCard} cannot block ${pending.action}`, 'INVALID_BLOCK_CARD');
      }

      const blockResult = resolveBlock(gameState, responder, blockCard);
      return blockResult.updatedState;
    }

    throw new AppError(`Unknown response: ${response}`, 'UNKNOWN_RESPONSE');
  }

  // -----------------------------------------------------------------------
  // processBlockChallenge — actor challenges a block claim
  // -----------------------------------------------------------------------

  processBlockChallenge(
    gameState: Readonly<GameState>,
    challengerId: string,
  ): Readonly<GameState> {
    if (gameState.phase !== 'challenge_block') {
      throw new AppError('Not in challenge_block phase', 'WRONG_PHASE');
    }
    const block = gameState.pendingBlock;
    if (!block) throw new AppError('No pending block', 'NO_PENDING_BLOCK');

    const result = resolveChallenge({
      challengerId,
      challengedId: block.blockerId,
      claimedCard: block.claimedCard,
      gameState,
    });

    let state = result.updatedState;

    if (result.challengerWon) {
      // Block was a bluff — original action goes through
      state = postInfluenceLoss(state);
      if (state.phase === 'game_over') return state;
      return this.finaliseAction({ ...state, pendingBlock: null });
    }

    // Block was legitimate — action is cancelled
    state = postInfluenceLoss(state);
    if (state.phase === 'game_over') return state;
    return advanceTurn({
      ...state,
      phase: 'action',
      pendingAction: null,
      pendingBlock: null,
    });
  }

  // -----------------------------------------------------------------------
  // processLoseInfluence — player picks which card to lose
  // -----------------------------------------------------------------------

  processLoseInfluence(
    gameState: Readonly<GameState>,
    playerId: string,
    cardIndex: number,
  ): Readonly<GameState> {
    if (gameState.phase !== 'lose_influence') {
      throw new AppError('Not in lose_influence phase', 'WRONG_PHASE');
    }
    if (gameState.losInfluencePlayerId !== playerId) {
      throw new AppError('Not your turn to lose influence', 'WRONG_PLAYER');
    }

    const player = getPlayer(gameState, playerId);
    if (cardIndex < 0 || cardIndex >= player.influences.length) {
      throw new AppError('Invalid card index', 'INVALID_CARD_INDEX');
    }

    const influences = [...player.influences];
    const [lostCard] = influences.splice(cardIndex, 1);
    const revealedCards = [...player.revealedCards, lostCard];
    const isAlive = influences.length > 0;

    let state = updatePlayer(gameState, playerId, { influences, revealedCards, isAlive });

    state = appendEvents(state, [{
      type: 'influence_lost',
      payload: { playerId, card: lostCard, isAlive },
    }]);

    state = postInfluenceLoss(state);
    if (state.phase === 'game_over') return state;

    return advanceTurn({
      ...state,
      phase: 'action',
      pendingAction: null,
      pendingBlock: null,
      losInfluencePlayerId: null,
    });
  }

  // -----------------------------------------------------------------------
  // processExchangeReturn — player picks which cards to keep
  // -----------------------------------------------------------------------

  processExchangeReturn(
    gameState: Readonly<GameState>,
    playerId: string,
    selectedCards: readonly CardType[],
  ): Readonly<GameState> {
    if (gameState.phase !== 'exchange_return') {
      throw new AppError('Not in exchange_return phase', 'WRONG_PHASE');
    }
    if (!gameState.exchangeCards) {
      throw new AppError('No exchange cards available', 'NO_EXCHANGE_CARDS');
    }

    const player = getPlayer(gameState, playerId);
    const expectedCount = player.influences.length;
    if (selectedCards.length !== expectedCount) {
      throw new AppError(
        `Must select exactly ${expectedCount} card(s) to keep`,
        'INVALID_SELECTION',
      );
    }

    // Validate that selected cards are a subset of exchangeCards
    const available = [...gameState.exchangeCards];
    for (const card of selectedCards) {
      const idx = available.indexOf(card);
      if (idx === -1) {
        throw new AppError(`Card ${card} is not available for selection`, 'INVALID_CARD');
      }
      available.splice(idx, 1);
    }

    // Remaining cards go back to the deck
    const deck = shuffleDeck([...gameState.deck, ...available]);

    let state = updatePlayer(gameState, playerId, {
      influences: [...selectedCards],
    });

    state = appendEvents(state, [{
      type: 'action_resolved',
      payload: { actorId: playerId, action: ActionType.EXCHANGE },
    }]);

    return advanceTurn({
      ...state,
      deck,
      phase: 'action',
      pendingAction: null,
      pendingBlock: null,
      exchangeCards: null,
    });
  }

  // -----------------------------------------------------------------------
  // checkWinCondition
  // -----------------------------------------------------------------------

  checkWinCondition(gameState: Readonly<GameState>): string | null {
    const alive = gameState.turnOrder.filter((id) => gameState.players.get(id)?.isAlive);
    return alive.length === 1 ? alive[0] : null;
  }

  // -----------------------------------------------------------------------
  // Private: finalise a pending action that was not blocked/challenged
  // -----------------------------------------------------------------------

  private finaliseAction(gameState: Readonly<GameState>): Readonly<GameState> {
    const pending = gameState.pendingAction;
    if (!pending) throw new AppError('No pending action to finalise', 'NO_PENDING_ACTION');

    const { newState } = resolveAction(gameState, pending.action, pending.actorId, pending.targetId);

    // Assassinate sends target to lose_influence
    if (pending.action === ActionType.ASSASSINATE && pending.targetId) {
      const target = newState.players.get(pending.targetId);
      if (target?.isAlive) {
        return {
          ...newState,
          phase: 'lose_influence',
          losInfluencePlayerId: pending.targetId,
          pendingAction: null,
          pendingBlock: null,
        };
      }
    }

    // Exchange sends actor to exchange_return
    if (pending.action === ActionType.EXCHANGE) {
      return {
        ...newState,
        phase: 'exchange_return',
        pendingAction: null,
        pendingBlock: null,
      };
    }

    return advanceTurn({
      ...newState,
      phase: 'action',
      pendingAction: null,
      pendingBlock: null,
    });
  }
}
