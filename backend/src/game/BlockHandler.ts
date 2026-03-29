import {
  ActionType,
  type CardType,
  type GameState,
  type GameEvent,
} from '../types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type BlockableAction =
  | ActionType.FOREIGN_AID
  | ActionType.STEAL
  | ActionType.ASSASSINATE;

export interface BlockResult {
  readonly blocked: boolean;
  readonly updatedState: Readonly<GameState>;
}

// ---------------------------------------------------------------------------
// Blocking rules
// ---------------------------------------------------------------------------

const BLOCK_MAP: Readonly<Record<BlockableAction, readonly CardType[]>> = {
  [ActionType.FOREIGN_AID]: ['Duke'],
  [ActionType.STEAL]:       ['Captain', 'Ambassador'],
  [ActionType.ASSASSINATE]: ['Contessa'],
};

const BLOCKABLE_ACTIONS: ReadonlySet<ActionType> = new Set(
  Object.keys(BLOCK_MAP) as BlockableAction[],
);

/**
 * Type-guard: returns true if the action can be blocked.
 */
export function canBlock(action: ActionType): action is BlockableAction {
  return BLOCKABLE_ACTIONS.has(action);
}

/**
 * Return the list of cards that can legally block `action`.
 * Returns an empty array for non-blockable actions.
 */
export function getBlockingCards(action: ActionType): readonly CardType[] {
  if (!canBlock(action)) return [];
  return BLOCK_MAP[action];
}

/**
 * Apply a block to the game state. This undoes the pending action's effect
 * by transitioning the phase. The actual state rollback is handled by
 * GameEngine (which simply discards the resolved-action state and keeps
 * the pre-action state with coins already deducted where appropriate).
 *
 * Pure function — no side-effects.
 */
export function resolveBlock(
  gameState: Readonly<GameState>,
  blockerId: string,
  claimedCard: CardType,
): BlockResult {
  const events: GameEvent[] = [{
    type: 'action_blocked',
    payload: { blockerId, claimedCard, action: gameState.pendingAction?.action },
  }];

  const updatedState: GameState = {
    ...gameState,
    pendingBlock: { blockerId, claimedCard },
    phase: 'challenge_block',
    events: [...gameState.events, ...events],
  };

  return { blocked: true, updatedState };
}
