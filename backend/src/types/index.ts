// ---------------------------------------------------------------------------
// Card & Character types
// ---------------------------------------------------------------------------

export type CardType = 'Duke' | 'Assassin' | 'Contessa' | 'Captain' | 'Ambassador';

// ---------------------------------------------------------------------------
// Action enum (string-backed for serialisation safety)
// ---------------------------------------------------------------------------

export enum ActionType {
  INCOME       = 'income',
  FOREIGN_AID  = 'foreign_aid',
  COUP         = 'coup',
  TAX          = 'tax',
  ASSASSINATE  = 'assassinate',
  STEAL        = 'steal',
  EXCHANGE     = 'exchange',
}

// ---------------------------------------------------------------------------
// Game phases
// ---------------------------------------------------------------------------

export type GamePhase =
  | 'action'
  | 'challenge_action'
  | 'block'
  | 'challenge_block'
  | 'lose_influence'
  | 'exchange_return'
  | 'game_over';

// ---------------------------------------------------------------------------
// Per-player state (immutable at the engine boundary)
// ---------------------------------------------------------------------------

export interface PlayerState {
  readonly id: string;
  readonly name: string;
  readonly coins: number;
  readonly influences: readonly CardType[];
  readonly revealedCards: readonly CardType[];
  readonly isAlive: boolean;
}

// ---------------------------------------------------------------------------
// Pending action tracking
// ---------------------------------------------------------------------------

export interface PendingAction {
  readonly action: ActionType;
  readonly actorId: string;
  readonly targetId?: string;
  readonly claimedCard?: CardType;
}

export interface PendingBlock {
  readonly blockerId: string;
  readonly claimedCard: CardType;
}

// ---------------------------------------------------------------------------
// Full game state — every field is readonly
// ---------------------------------------------------------------------------

export interface GameState {
  readonly roomId: string;
  readonly players: ReadonlyMap<string, Readonly<PlayerState>>;
  readonly turnOrder: readonly string[];
  readonly currentTurnIndex: number;
  readonly deck: readonly CardType[];
  readonly phase: GamePhase;
  readonly pendingAction: Readonly<PendingAction> | null;
  readonly pendingBlock: Readonly<PendingBlock> | null;
  readonly losInfluencePlayerId: string | null;
  readonly exchangeCards: readonly CardType[] | null;
  readonly respondents: ReadonlySet<string>;
  readonly events: readonly GameEvent[];
  readonly winner: string | null;
}

// ---------------------------------------------------------------------------
// Events emitted by the engine (pure data, no side-effects)
// ---------------------------------------------------------------------------

export interface GameEvent {
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Database-layer types (unchanged, used by models)
// ---------------------------------------------------------------------------

export type RoomStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  max_players: number;
  created_at: Date;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  coins: number;
  is_alive: boolean;
  socket_id: string | null;
}

export interface PlayerCard {
  id: string;
  player_id: string;
  card: CardType;
  is_revealed: boolean;
}

export interface GameLogEntry {
  id: string;
  room_id: string;
  actor_id: string;
  action: string;
  target_id: string | null;
  result: string | null;
  created_at: Date;
}
