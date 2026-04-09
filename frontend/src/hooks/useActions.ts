import { useCallback, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import type { ActionType, CardType } from '../types';

// ---------------------------------------------------------------------------
// Loading key union
// ---------------------------------------------------------------------------

type LoadingKey = ActionType | 'response' | 'block' | 'challenge' | 'loseInfluence';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseActionsReturn {
  performAction: (action: ActionType, targetId?: string) => void;
  respondToAction: (response: 'pass' | 'block' | 'challenge', blockCard?: CardType) => void;
  challengeBlock: () => void;
  loseInfluence: (cardIndex: number) => void;
  loading: Partial<Record<LoadingKey, boolean>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useActions(): UseActionsReturn {
  const { socket } = useSocket();
  const { state } = useGame();
  const [loading, setLoading] = useState<Partial<Record<LoadingKey, boolean>>>({});

  const setKey = (key: LoadingKey, val: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const performAction = useCallback(
    (action: ActionType, targetId?: string) => {
      if (!socket) return;
      const roomCode = state.roomCode;
      if (!roomCode) return;
      setKey(action, true);
      socket.emit('game_action', { roomCode, action, targetId });
      // Loading is cleared when the next state_update arrives (handled by GameContext)
      setTimeout(() => setKey(action, false), 2000);
    },
    [socket, state.roomCode],
  );

  const respondToAction = useCallback(
    (response: 'pass' | 'block' | 'challenge', blockCard?: CardType) => {
      if (!socket) return;
      const roomCode = state.roomCode;
      if (!roomCode) return;
      const key: LoadingKey = response === 'block' ? 'block' : response === 'challenge' ? 'challenge' : 'response';
      setKey(key, true);
      socket.emit('player_response', { roomCode, response, blockCard });
      setTimeout(() => setKey(key, false), 2000);
    },
    [socket, state.roomCode],
  );

  const challengeBlock = useCallback(() => {
    if (!socket) return;
    const roomCode = state.roomCode;
    if (!roomCode) return;
    setKey('challenge', true);
    socket.emit('block_challenge', { roomCode });
    setTimeout(() => setKey('challenge', false), 2000);
  }, [socket, state.roomCode]);

  const loseInfluence = useCallback(
    (cardIndex: number) => {
      if (!socket) return;
      const roomCode = state.roomCode;
      if (!roomCode) return;
      setKey('loseInfluence', true);
      socket.emit('lose_influence', { roomCode, cardIndex });
      setTimeout(() => setKey('loseInfluence', false), 2000);
    },
    [socket, state.roomCode],
  );

  return { performAction, respondToAction, challengeBlock, loseInfluence, loading };
}
