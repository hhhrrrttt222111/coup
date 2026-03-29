import axios, { type AxiosError, type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import type { Room, Player, GameLogEntry } from '../types';

// ---------------------------------------------------------------------------
// Error shape returned by the backend
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
  code: string;
}

export function isApiError(e: unknown): e is AxiosError<ApiError> {
  if (!axios.isAxiosError(e)) return false;
  const data = e.response?.data as Record<string, unknown> | undefined;
  return typeof data?.error === 'string' && typeof data?.code === 'string';
}

// ---------------------------------------------------------------------------
// Global error callback (module-level subject pattern)
// ---------------------------------------------------------------------------

type ErrorCallback = (err: ApiError) => void;
let onGlobalError: ErrorCallback | null = null;

export function setGlobalErrorHandler(cb: ErrorCallback): void {
  onGlobalError = cb;
}

// ---------------------------------------------------------------------------
// Typed Axios instance
// ---------------------------------------------------------------------------

const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api`,
});

// Retry on 503 once after 1 second
axiosRetry(api, {
  retries: 1,
  retryCondition: (error) => error.response?.status === 503,
  retryDelay: () => 1000,
});

// Attach player identity header on every request
api.interceptors.request.use((config) => {
  const playerId = sessionStorage.getItem('playerId');
  if (playerId) {
    config.headers['X-Player-Id'] = playerId;
  }
  return config;
});

// Normalise errors so callers always receive a typed ApiError body
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiError>) => {
    let apiErr: ApiError;

    if (err.response?.data?.error) {
      apiErr = err.response.data;
    } else {
      apiErr = {
        error: err.message || 'Network error',
        code: 'NETWORK_ERROR',
      };
      if (err.response) {
        (err.response.data as ApiError) = apiErr;
      }
    }

    if (onGlobalError) {
      onGlobalError(apiErr);
    }

    return Promise.reject(err);
  },
);

// ---------------------------------------------------------------------------
// Typed API functions
// ---------------------------------------------------------------------------

interface CreateRoomParams {
  playerName: string;
  maxPlayers: number;
}

interface CreateRoomResponse {
  roomCode: string;
  playerId: string;
  roomId: string;
}

export async function createRoom(params: CreateRoomParams): Promise<CreateRoomResponse> {
  const { data } = await api.post<CreateRoomResponse>('/rooms', params);
  return data;
}

interface JoinRoomParams {
  code: string;
  playerName: string;
}

interface JoinRoomResponse {
  playerId: string;
}

export async function joinRoom(params: JoinRoomParams): Promise<JoinRoomResponse> {
  const { data } = await api.post<JoinRoomResponse>(
    `/rooms/${encodeURIComponent(params.code)}/join`,
    { playerName: params.playerName },
  );
  return data;
}

export async function getRoom(code: string): Promise<Room & { players: Player[] }> {
  const { data } = await api.get<Room & { players: Player[] }>(
    `/rooms/${encodeURIComponent(code)}`,
  );
  return data;
}

export async function getRoomLog(code: string): Promise<GameLogEntry[]> {
  const { data } = await api.get<GameLogEntry[]>(
    `/rooms/${encodeURIComponent(code)}/log`,
  );
  return data;
}
