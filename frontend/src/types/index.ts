// ---------------------------------------------------------------------------
// Shared types (mirrored from backend for type-safety without a monorepo pkg)
// ---------------------------------------------------------------------------

export type CardType = 'Duke' | 'Assassin' | 'Contessa' | 'Captain' | 'Ambassador';

export enum ActionType {
  INCOME      = 'income',
  FOREIGN_AID = 'foreign_aid',
  COUP        = 'coup',
  TAX         = 'tax',
  ASSASSINATE = 'assassinate',
  STEAL       = 'steal',
  EXCHANGE    = 'exchange',
}

export type GamePhase =
  | 'lobby'
  | 'action'
  | 'challenge_action'
  | 'block'
  | 'challenge_block'
  | 'lose_influence'
  | 'exchange_return'
  | 'game_over';

export type RoomStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';

// ---------------------------------------------------------------------------
// DB / REST types
// ---------------------------------------------------------------------------

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  max_players: number;
  created_at: string;
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
  created_at: string;
}

// ---------------------------------------------------------------------------
// Engine state types (sent over the wire from backend, serialised)
// ---------------------------------------------------------------------------

export interface PlayerState {
  readonly id: string;
  readonly name: string;
  readonly coins: number;
  readonly influences: readonly CardType[];
  readonly influenceCount: number;
  readonly revealedCards: readonly CardType[];
  readonly isAlive: boolean;
}

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

export interface GameEvent {
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Serialised GameState as received over Socket.IO.
 * Maps are serialised as plain objects; Sets as arrays.
 */
export interface GameState {
  readonly roomId: string;
  readonly players: Record<string, PlayerState>;
  readonly turnOrder: readonly string[];
  readonly currentTurnIndex: number;
  readonly deck: readonly CardType[];
  readonly phase: GamePhase;
  readonly pendingAction: PendingAction | null;
  readonly pendingBlock: PendingBlock | null;
  readonly losInfluencePlayerId: string | null;
  readonly exchangeCards: readonly CardType[] | null;
  readonly respondents: readonly string[];
  readonly events: readonly GameEvent[];
  readonly winner: string | null;
}

// ---------------------------------------------------------------------------
// Sanitized player (as sent from backend to each client)
// ---------------------------------------------------------------------------

export interface SanitizedPlayer {
  readonly id: string;
  readonly name: string;
  readonly coins: number;
  readonly influenceCount: number;
  readonly revealedCards: readonly CardType[];
  readonly isAlive: boolean;
  readonly influences?: readonly CardType[];
}

// ---------------------------------------------------------------------------
// Socket.IO event maps (client ↔ server)
// ---------------------------------------------------------------------------

// Client → Server payloads

export interface JoinRoomPayload {
  readonly roomCode: string;
  readonly playerName: string;
}

export interface StartGamePayload {
  readonly roomCode: string;
}

export interface GameActionPayload {
  readonly roomCode: string;
  readonly action: ActionType;
  readonly targetId?: string;
}

export interface PlayerResponsePayload {
  readonly roomCode: string;
  readonly response: 'pass' | 'block' | 'challenge';
  readonly blockCard?: CardType;
}

export interface BlockChallengePayload {
  readonly roomCode: string;
}

export interface LoseInfluencePayload {
  readonly roomCode: string;
  readonly cardIndex: number;
}

export interface ExchangeSelectPayload {
  readonly roomCode: string;
  readonly selectedCards: readonly CardType[];
}

// Server → Client payloads

export interface RoomJoinedPayload {
  readonly playerId: string;
  readonly playerName: string;
  readonly players: readonly SanitizedPlayer[];
  readonly roomCode: string;
}

export interface PlayerJoinedPayload {
  readonly playerId: string;
  readonly playerName: string;
  readonly players: readonly SanitizedPlayer[];
}

export interface GameStartedPayload {
  readonly state: GameState;
}

export interface StateUpdatePayload {
  readonly state: GameState;
}

export interface AwaitResponsePayload {
  readonly phase: GamePhase;
  readonly actorId: string;
  readonly action: ActionType;
  readonly targetId?: string;
  readonly claimedCard?: CardType;
  readonly deadline: number;
}

export interface ChallengeResultPayload {
  readonly challengerId: string;
  readonly challengedId: string;
  readonly challengerWon: boolean;
  readonly loserPlayerId: string;
  readonly cardRevealed: CardType;
}

export interface BlockDeclaredPayload {
  readonly blockerId: string;
  readonly claimedCard: CardType;
  readonly action: ActionType;
  readonly deadline: number;
}

export interface BlockChallengeResultPayload {
  readonly challengerId: string;
  readonly blockerId: string;
  readonly challengerWon: boolean;
  readonly loserPlayerId: string;
  readonly cardRevealed: CardType;
}

export interface InfluenceLostPayload {
  readonly playerId: string;
  readonly card: CardType;
  readonly isAlive: boolean;
}

export interface PlayerDisconnectedPayload {
  readonly playerId: string;
  readonly playerName: string;
}

export interface GameOverPayload {
  readonly winnerId: string;
  readonly winnerName: string;
}

export interface ErrorPayload {
  readonly message: string;
  readonly code?: string;
}

export interface RestartGamePayload {
  readonly roomCode: string;
}

export interface GameRestartedPayload {
  readonly players: readonly SanitizedPlayer[];
}

// ---------------------------------------------------------------------------
// Typed event maps
// ---------------------------------------------------------------------------

export interface ClientToServerEvents {
  join_room: (payload: JoinRoomPayload) => void;
  start_game: (payload: StartGamePayload) => void;
  game_action: (payload: GameActionPayload) => void;
  player_response: (payload: PlayerResponsePayload) => void;
  block_challenge: (payload: BlockChallengePayload) => void;
  lose_influence: (payload: LoseInfluencePayload) => void;
  exchange_select: (payload: ExchangeSelectPayload) => void;
  restart_game: (payload: RestartGamePayload) => void;
}

export interface ServerToClientEvents {
  room_joined: (payload: RoomJoinedPayload) => void;
  player_joined: (payload: PlayerJoinedPayload) => void;
  game_started: (payload: GameStartedPayload) => void;
  state_update: (payload: StateUpdatePayload) => void;
  await_response: (payload: AwaitResponsePayload) => void;
  challenge_result: (payload: ChallengeResultPayload) => void;
  block_declared: (payload: BlockDeclaredPayload) => void;
  block_challenge_result: (payload: BlockChallengeResultPayload) => void;
  influence_lost: (payload: InfluenceLostPayload) => void;
  player_disconnected: (payload: PlayerDisconnectedPayload) => void;
  game_over: (payload: GameOverPayload) => void;
  game_restarted: (payload: GameRestartedPayload) => void;
  error: (payload: ErrorPayload) => void;
}
