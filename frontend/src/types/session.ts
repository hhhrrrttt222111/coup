export interface SessionData {
  playerId: string;
  playerName: string;
  roomCode: string;
}

const KEYS = ['playerId', 'playerName', 'roomCode'] as const;

export function storeSession(data: SessionData): void {
  sessionStorage.setItem('playerId', data.playerId);
  sessionStorage.setItem('playerName', data.playerName);
  sessionStorage.setItem('roomCode', data.roomCode);
}

export function getSession(): SessionData | null {
  const playerId = sessionStorage.getItem('playerId');
  const playerName = sessionStorage.getItem('playerName');
  const roomCode = sessionStorage.getItem('roomCode');

  if (!playerId || !playerName || !roomCode) return null;
  return { playerId, playerName, roomCode };
}

export function clearSession(): void {
  for (const key of KEYS) {
    sessionStorage.removeItem(key);
  }
}
