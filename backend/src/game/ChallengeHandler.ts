import {
  ActionType,
  AppError,
  type CardType,
  type GameState,
  type GameEvent,
  type PlayerState,
} from '../types';
import { shuffleDeck } from './DeckManager';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface ChallengeResult {
  readonly challengerWon: boolean;
  readonly loserPlayerId: string;
  readonly cardRevealed: CardType;
  readonly updatedState: Readonly<GameState>;
}

interface ResolveChallengeParams {
  readonly challengerId: string;
  readonly challengedId: string;
  readonly claimedCard: CardType;
  readonly gameState: Readonly<GameState>;
}

// ---------------------------------------------------------------------------
// Which actions can be challenged?
// ---------------------------------------------------------------------------

const CHALLENGEABLE_ACTIONS: ReadonlySet<ActionType> = new Set([
  ActionType.TAX,
  ActionType.ASSASSINATE,
  ActionType.STEAL,
  ActionType.EXCHANGE,
]);

export function canChallenge(action: ActionType): boolean {
  return CHALLENGEABLE_ACTIONS.has(action);
}

// ---------------------------------------------------------------------------
// Helpers
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

function loseInfluence(
  state: Readonly<GameState>,
  playerId: string,
  cardIndex: number,
): { state: GameState; lostCard: CardType } {
  const player = getPlayer(state, playerId);
  const influences = [...player.influences];
  const [lostCard] = influences.splice(cardIndex, 1);
  const revealedCards = [...player.revealedCards, lostCard];
  const isAlive = influences.length > 0;
  const newState = updatePlayer(state, playerId, { influences, revealedCards, isAlive });
  return { state: newState, lostCard };
}

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a challenge. Pure function — no side-effects.
 *
 * If the challenged player actually holds the claimed card:
 *   - The **challenger** loses one influence (first unrevealed).
 *   - The challenged player returns the proved card to the deck,
 *     shuffles, and draws a replacement.
 *
 * If the challenged player was bluffing:
 *   - The challenged player reveals the first card that is NOT the
 *     claimed card (since they don't have it) — effectively their
 *     first unrevealed influence.
 */
export function resolveChallenge(params: ResolveChallengeParams): ChallengeResult {
  const { challengerId, challengedId, claimedCard, gameState } = params;

  const challenger  = getPlayer(gameState, challengerId);
  const challenged  = getPlayer(gameState, challengedId);

  if (!challenger.isAlive) throw new AppError('Challenger is eliminated', 'PLAYER_ELIMINATED');
  if (!challenged.isAlive) throw new AppError('Challenged player is eliminated', 'PLAYER_ELIMINATED');

  const cardIndex = challenged.influences.indexOf(claimedCard);
  const hasCard   = cardIndex !== -1;

  const events: GameEvent[] = [];
  let state: GameState = { ...gameState };

  if (hasCard) {
    // ── Challenger was wrong — they lose an influence ────────────────
    const challengerResult = loseInfluence(state, challengerId, 0);
    state = challengerResult.state;

    // Challenged returns the proved card to the deck, shuffles, draws 1
    const influences = [...challenged.influences];
    influences.splice(cardIndex, 1);
    let deck = [...state.deck, claimedCard];
    deck = shuffleDeck(deck);
    const replacement = deck.shift()!;
    influences.push(replacement);

    state = { ...state, deck };
    state = updatePlayer(state, challengedId, { influences });

    events.push({
      type: 'challenge_failed',
      payload: { challengerId, challengedId, claimedCard, loserPlayerId: challengerId, cardRevealed: challengerResult.lostCard },
    });

    return {
      challengerWon: false,
      loserPlayerId: challengerId,
      cardRevealed: challengerResult.lostCard,
      updatedState: { ...state, events: [...state.events, ...events] },
    };
  }

  // ── Challenged was bluffing — they lose an influence ──────────────
  const challengedResult = loseInfluence(state, challengedId, 0);
  state = challengedResult.state;

  events.push({
    type: 'challenge_succeeded',
    payload: { challengerId, challengedId, claimedCard, loserPlayerId: challengedId, cardRevealed: challengedResult.lostCard },
  });

  return {
    challengerWon: true,
    loserPlayerId: challengedId,
    cardRevealed: challengedResult.lostCard,
    updatedState: { ...state, events: [...state.events, ...events] },
  };
}
