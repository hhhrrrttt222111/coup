import {
  ActionType,
  AppError,
  type CardType,
  type GameState,
  type GameEvent,
  type PlayerState,
} from '../types';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ActionResult {
  readonly success: boolean;
  readonly newState: Readonly<GameState>;
  readonly events: readonly GameEvent[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COUP_COST       = 7;
const ASSASSINATE_COST = 3;
const MAX_COINS_FORCE_COUP = 10;

/**
 * Map from action → the card the actor implicitly claims to hold.
 * Actions not in this map are "general" and don't claim a card.
 */
const ACTION_CLAIMED_CARD: Readonly<Partial<Record<ActionType, CardType>>> = {
  [ActionType.TAX]:         'Duke',
  [ActionType.ASSASSINATE]: 'Assassin',
  [ActionType.STEAL]:       'Captain',
  [ActionType.EXCHANGE]:    'Ambassador',
};

// ---------------------------------------------------------------------------
// Helpers — all produce new objects, never mutate
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
): Readonly<GameState> {
  const prev = getPlayer(state, id);
  const updated: PlayerState = { ...prev, ...patch };
  const players = new Map(state.players);
  players.set(id, Object.freeze(updated));
  return { ...state, players };
}

function requireAlive(player: Readonly<PlayerState>): void {
  if (!player.isAlive) {
    throw new AppError(`Player ${player.id} is eliminated`, 'PLAYER_ELIMINATED');
  }
}

function requireTarget(targetId: string | undefined, action: ActionType): asserts targetId is string {
  if (!targetId) {
    throw new AppError(`${action} requires a target`, 'TARGET_REQUIRED');
  }
}

// ---------------------------------------------------------------------------
// Core resolver (pure)
// ---------------------------------------------------------------------------

export function resolveAction(
  gameState: Readonly<GameState>,
  action: ActionType,
  actorId: string,
  targetId?: string,
): ActionResult {
  const actor = getPlayer(gameState, actorId);
  requireAlive(actor);

  // ── Must-coup rule ───────────────────────────────────────────────────
  if (actor.coins >= MAX_COINS_FORCE_COUP && action !== ActionType.COUP) {
    throw new AppError(
      'You must coup when you have 10+ coins',
      'MUST_COUP',
    );
  }

  const events: GameEvent[] = [];
  let state: GameState = { ...gameState };

  switch (action) {
    // ── Income (unblockable, unchallengeable) ─────────────────────────
    case ActionType.INCOME: {
      state = updatePlayer(state, actorId, { coins: actor.coins + 1 });
      events.push({ type: 'action_resolved', payload: { actorId, action } });
      break;
    }

    // ── Foreign Aid (blockable by Duke, unchallengeable) ──────────────
    case ActionType.FOREIGN_AID: {
      state = updatePlayer(state, actorId, { coins: actor.coins + 2 });
      events.push({ type: 'action_resolved', payload: { actorId, action } });
      break;
    }

    // ── Tax — Duke (challengeable) ────────────────────────────────────
    case ActionType.TAX: {
      state = updatePlayer(state, actorId, { coins: actor.coins + 3 });
      events.push({ type: 'action_resolved', payload: { actorId, action } });
      break;
    }

    // ── Steal — Captain (challengeable, blockable) ────────────────────
    case ActionType.STEAL: {
      requireTarget(targetId, action);
      const target = getPlayer(state, targetId);
      requireAlive(target);
      const stolen = Math.min(target.coins, 2);
      state = updatePlayer(state, actorId, { coins: actor.coins + stolen });
      state = updatePlayer(state, targetId, { coins: target.coins - stolen });
      events.push({ type: 'action_resolved', payload: { actorId, action, targetId, stolen } });
      break;
    }

    // ── Assassinate (costs 3, challengeable, blockable by Contessa) ───
    case ActionType.ASSASSINATE: {
      requireTarget(targetId, action);
      if (actor.coins < ASSASSINATE_COST) {
        throw new AppError('Not enough coins to assassinate', 'INSUFFICIENT_COINS');
      }
      state = updatePlayer(state, actorId, { coins: actor.coins - ASSASSINATE_COST });
      events.push({ type: 'action_resolved', payload: { actorId, action, targetId } });
      break;
    }

    // ── Coup (costs 7, unblockable, unchallengeable) ──────────────────
    case ActionType.COUP: {
      requireTarget(targetId, action);
      if (actor.coins < COUP_COST) {
        throw new AppError('Not enough coins to coup', 'INSUFFICIENT_COINS');
      }
      state = updatePlayer(state, actorId, { coins: actor.coins - COUP_COST });
      events.push({ type: 'action_resolved', payload: { actorId, action, targetId } });
      break;
    }

    // ── Exchange — Ambassador (challengeable) ─────────────────────────
    case ActionType.EXCHANGE: {
      const deck = [...state.deck];
      const drawn = deck.splice(0, 2);
      state = {
        ...state,
        deck,
        exchangeCards: [...actor.influences, ...drawn],
      };
      events.push({ type: 'action_resolved', payload: { actorId, action } });
      break;
    }

    default: {
      throw new AppError(`Unknown action: ${action as string}`, 'UNKNOWN_ACTION');
    }
  }

  return {
    success: true,
    newState: { ...state, events: [...state.events, ...events] },
    events,
  };
}

/**
 * Return the card implicitly claimed by an action, or undefined
 * for general actions (income, foreign_aid, coup).
 */
export function getClaimedCard(action: ActionType): CardType | undefined {
  return ACTION_CLAIMED_CARD[action];
}
