import type { CardType } from '../types';

const ALL_CHARACTERS: readonly CardType[] = [
  'Duke', 'Assassin', 'Contessa', 'Captain', 'Ambassador',
];

const COPIES_PER_CHARACTER = 3;
const CARDS_PER_PLAYER = 2;

/**
 * Build a fresh 15-card deck (3 copies of each of the 5 characters).
 */
export function buildDeck(): CardType[] {
  const deck: CardType[] = [];
  for (const character of ALL_CHARACTERS) {
    for (let i = 0; i < COPIES_PER_CHARACTER; i++) {
      deck.push(character);
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle. Returns a new array — does not mutate the input.
 */
export function shuffleDeck(deck: readonly CardType[]): CardType[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deal `CARDS_PER_PLAYER` cards to each player from the top of the deck.
 *
 * @param deck          The shuffled deck to deal from (not mutated).
 * @param playerIds     Ordered list of player ids to receive hands.
 * @returns             A map of playerId → hand, plus the remaining deck.
 */
export function dealCards(
  deck: readonly CardType[],
  playerIds: readonly string[],
): { hands: Map<string, CardType[]>; remainingDeck: CardType[] } {
  const mutable = [...deck];
  const hands = new Map<string, CardType[]>();

  for (const id of playerIds) {
    hands.set(id, mutable.splice(0, CARDS_PER_PLAYER));
  }

  return { hands, remainingDeck: mutable };
}
