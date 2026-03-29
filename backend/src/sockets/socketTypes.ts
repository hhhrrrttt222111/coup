import type { Server, Socket } from 'socket.io';
import type {
  ActionType,
  CardType,
  GameState,
  GameEvent,
} from '../types';

/**
 * Player state as sent over the wire. Opponents get empty influences
 * but influenceCount tells the client how many hidden cards they hold.
 */
export interface SerializedPlayerState {
  readonly id: string;
  readonly name: string;
  readonly coins: number;
  readonly influences: readonly CardType[];
  readonly influenceCount: number;
  readonly revealedCards: readonly CardType[];
  readonly isAlive: boolean;
}

/**
 * JSON-safe version of GameState for over-the-wire transmission.
 * Maps become plain objects, Sets become arrays.
 */
export interface SerializedGameState {
  readonly roomId: string;
  readonly players: Record<string, SerializedPlayerState>;
  readonly turnOrder: readonly string[];
  readonly currentTurnIndex: number;
  readonly deck: readonly CardType[];
  readonly phase: GameState['phase'];
  readonly pendingAction: GameState['pendingAction'];
  readonly pendingBlock: GameState['pendingBlock'];
  readonly losInfluencePlayerId: string | null;
  readonly exchangeCards: readonly CardType[] | null;
  readonly respondents: readonly string[];
  readonly events: readonly GameEvent[];
  readonly winner: string | null;
}

// ---------------------------------------------------------------------------
// Client → Server payloads
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Server → Client payloads
// ---------------------------------------------------------------------------

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
  readonly state: SerializedGameState;
}

export interface StateUpdatePayload {
  readonly state: SerializedGameState;
}

export interface AwaitResponsePayload {
  readonly phase: GameState['phase'];
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

// ---------------------------------------------------------------------------
// Sanitized player (influences hidden for opponents)
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
// Typed Socket.IO event maps
// ---------------------------------------------------------------------------

export interface RestartGamePayload {
  readonly roomCode: string;
}

export interface GameRestartedPayload {
  readonly players: readonly SanitizedPlayer[];
}

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

// ---------------------------------------------------------------------------
// Per-socket custom data (set during join_room)
// ---------------------------------------------------------------------------

export interface SocketData {
  playerId: string;
  playerName: string;
  roomCode: string;
}

// ---------------------------------------------------------------------------
// Typed Server & Socket
// ---------------------------------------------------------------------------

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
