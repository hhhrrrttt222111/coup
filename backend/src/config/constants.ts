import type { CardType } from '../types';

export const CHARACTERS: CardType[] = ['Duke', 'Assassin', 'Contessa', 'Captain', 'Ambassador'];

export const ACTIONS = {
  INCOME: 'income',
  FOREIGN_AID: 'foreign_aid',
  COUP: 'coup',
  TAX: 'tax',
  ASSASSINATE: 'assassinate',
  STEAL: 'steal',
  EXCHANGE: 'exchange',
} as const;

export type ActionKey = (typeof ACTIONS)[keyof typeof ACTIONS];

export const COINS_START = 2;
export const COUP_COST = 7;
export const ASSASSINATE_COST = 3;
export const MAX_COINS_BEFORE_COUP = 10;

export const RESPONSE_TIMEOUT_MS = 15_000;
export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;
export const COINS_TO_FORCE_COUP = 10;
