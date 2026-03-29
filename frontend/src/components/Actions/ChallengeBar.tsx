import { useEffect, useState } from 'react';
import { Button, Stack, Typography, Menu, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import { coupColors } from '../../theme/ThemeProvider';
import type { PendingAction, CardType, PlayerState } from '../../types';

export interface ChallengeBarProps {
  pendingAction: PendingAction;
  timeLeft: number;
  onChallenge: () => void;
  onBlock: (card: CardType) => void;
  onPass: () => void;
  blockOptions: CardType[];
  myPlayerId: string;
  disabled: boolean;
  players: Record<string, PlayerState>;
}

export default function ChallengeBar({
  pendingAction,
  timeLeft,
  onChallenge,
  onBlock,
  onPass,
  blockOptions,
  myPlayerId,
  disabled,
  players,
}: ChallengeBarProps) {
  const [blockAnchor, setBlockAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      onPass();
      return;
    }
    const timer = setTimeout(() => onPass(), timeLeft);
    return () => clearTimeout(timer);
  }, [timeLeft, onPass]);

  const isActor = pendingAction.actorId === myPlayerId;
  if (isActor) return null;

  const actorName = players[pendingAction.actorId]?.name ?? 'Someone';
  const actionLabel = pendingAction.action.replace(/_/g, ' ');

  return (
    <Stack
      spacing={1.5}
      className="relative rounded-xl p-4"
      sx={{
        bgcolor: coupColors.surface,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="absolute left-0 top-0 h-1 w-full overflow-hidden rounded-t-xl">
        <motion.div
          className="h-full"
          style={{ backgroundColor: coupColors.crimsonLight }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: timeLeft / 1000, ease: 'linear' }}
        />
      </div>

      <Typography variant="body2" sx={{ color: coupColors.textSecondary }}>
        <Typography component="span" sx={{ color: coupColors.gold, fontWeight: 700 }}>
          {actorName}
        </Typography>
        {' '}declared{' '}
        <Typography component="span" sx={{ color: coupColors.crimsonLight, fontWeight: 700 }}>
          {actionLabel}
        </Typography>
        {pendingAction.claimedCard && (
          <>
            {' '}claiming{' '}
            <Typography component="span" sx={{ fontWeight: 700, color: coupColors.textPrimary }}>
              {pendingAction.claimedCard}
            </Typography>
          </>
        )}
      </Typography>

      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          size="small"
          disabled={disabled}
          onClick={onChallenge}
          sx={{
            background: `linear-gradient(135deg, ${coupColors.crimson}, ${coupColors.crimsonLight})`,
            '&:hover': { background: `linear-gradient(135deg, ${coupColors.crimsonLight}, ${coupColors.crimson})` },
            fontWeight: 700,
          }}
        >
          Challenge
        </Button>

        {blockOptions.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            disabled={disabled}
            onClick={(e) => setBlockAnchor(e.currentTarget)}
            sx={{
              borderColor: coupColors.gold,
              color: coupColors.gold,
              fontWeight: 700,
              '&:hover': { bgcolor: `${coupColors.gold}0a` },
            }}
          >
            Block
          </Button>
        )}

        <Button
          variant="text"
          size="small"
          disabled={disabled}
          onClick={onPass}
          sx={{ color: coupColors.textMuted }}
        >
          Pass
        </Button>
      </Stack>

      <Menu
        anchorEl={blockAnchor}
        open={!!blockAnchor}
        onClose={() => setBlockAnchor(null)}
      >
        <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem' }}>
          Block with...
        </MenuItem>
        {blockOptions.map((card) => (
          <MenuItem
            key={card}
            onClick={() => { onBlock(card); setBlockAnchor(null); }}
            sx={{ color: coupColors.textPrimary, '&:hover': { bgcolor: `${coupColors.gold}12` } }}
          >
            {card}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
