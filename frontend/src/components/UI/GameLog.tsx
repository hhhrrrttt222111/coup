import { useRef, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { coupColors } from '../../theme/ThemeProvider';
import type { GameEvent, PlayerState } from '../../types';

function playerName(
  id: unknown,
  players: Record<string, PlayerState>,
): string {
  if (typeof id !== 'string') return 'Unknown';
  return players[id]?.name ?? 'Unknown';
}

function formatEvent(
  event: GameEvent,
  players: Record<string, PlayerState>,
): string {
  const p = event.payload;
  const actor = playerName(p.actorId, players);
  const target = p.targetId ? playerName(p.targetId, players) : '';

  switch (event.type) {
    case 'game_started':
      return 'The game has started!';

    case 'action_declared': {
      const action = String(p.action ?? '').replace(/_/g, ' ');
      const claimed = p.claimedCard ? ` (claiming ${p.claimedCard})` : '';
      if (target) return `${actor} declared ${action} on ${target}${claimed}`;
      return `${actor} declared ${action}${claimed}`;
    }

    case 'action_resolved': {
      const action = String(p.action ?? '').replace(/_/g, ' ');
      if (p.stolen) return `${actor} stole ${p.stolen} coin(s) from ${target}`;
      if (target) return `${actor} used ${action} on ${target}`;
      return `${actor} used ${action}`;
    }

    case 'challenge_succeeded': {
      const challenger = playerName(p.challengerId, players);
      const challenged = playerName(p.challengedId, players);
      return `${challenger} challenged ${challenged} — challenge succeeded! ${challenged} was bluffing.`;
    }

    case 'challenge_failed': {
      const challenger = playerName(p.challengerId, players);
      const challenged = playerName(p.challengedId, players);
      return `${challenger} challenged ${challenged} — challenge failed! ${challenged} had the card.`;
    }

    case 'block_declared': {
      const blocker = playerName(p.blockerId, players);
      return `${blocker} blocked with ${p.claimedCard}`;
    }

    case 'influence_lost': {
      const who = playerName(p.playerId, players);
      const alive = p.isAlive ? '' : ' — eliminated!';
      return `${who} lost ${p.card}${alive}`;
    }

    case 'game_over': {
      const winner = playerName(p.winner, players);
      return `${winner} wins the game!`;
    }

    default: {
      const parts: string[] = [];
      for (const [k, v] of Object.entries(p)) {
        if (v !== undefined && v !== null) {
          const display = typeof v === 'string' && players[v]
            ? players[v].name
            : String(v);
          parts.push(`${k}: ${display}`);
        }
      }
      return parts.join(', ') || event.type;
    }
  }
}

export default function GameLog() {
  const { state } = useGame();
  const events = state.gameState?.events ?? [];
  const players = state.gameState?.players ?? {};
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <Box className="flex h-full flex-col">
      <Typography
        variant="subtitle2"
        sx={{
          color: coupColors.gold,
          fontWeight: 800,
          letterSpacing: 2,
          mb: 1.5,
          fontSize: '0.7rem',
          fontFamily: '"Cinzel", serif',
        }}
      >
        GAME LOG
      </Typography>

      <Box
        className="mx-auto mb-3 h-px w-full"
        sx={{ background: `linear-gradient(90deg, ${coupColors.gold}30, transparent)` }}
      />

      <Box className="flex-1 overflow-y-auto pr-1" sx={{ maxHeight: 'calc(100vh - 120px)' }}>
        <AnimatePresence initial={false}>
          {events.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-1.5"
            >
              <Typography variant="caption" sx={{ color: coupColors.silverLight, lineHeight: 1.6, fontSize: '0.72rem' }}>
                {formatEvent(entry, players)}
              </Typography>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <Typography variant="caption" sx={{ color: coupColors.textMuted, fontStyle: 'italic' }}>
            Waiting for actions...
          </Typography>
        )}
        <div ref={bottomRef} />
      </Box>
    </Box>
  );
}
