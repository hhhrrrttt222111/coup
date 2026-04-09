import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button, Stack, Typography, Menu, MenuItem, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { coupColors } from '../../theme/ThemeProvider';
import type { PendingAction, CardType, PlayerState } from '../../types';

const MIN_DISPLAY_MS = 3000;

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
  const [responded, setResponded] = useState(false);
  const respondedRef = useRef(false);

  const actionKey = useMemo(
    () => `${pendingAction.actorId}-${pendingAction.action}-${pendingAction.targetId ?? ''}`,
    [pendingAction.actorId, pendingAction.action, pendingAction.targetId],
  );

  const effectiveTimeMs = useMemo(
    () => Math.max(timeLeft, MIN_DISPLAY_MS),
    [timeLeft],
  );

  const handlePass = useCallback(() => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    setResponded(true);
    onPass();
  }, [onPass]);

  const handleChallenge = useCallback(() => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    setResponded(true);
    onChallenge();
  }, [onChallenge]);

  const handleBlock = useCallback(
    (card: CardType) => {
      if (respondedRef.current) return;
      respondedRef.current = true;
      setResponded(true);
      onBlock(card);
    },
    [onBlock],
  );

  useEffect(() => {
    if (effectiveTimeMs <= 0) return;
    const timer = setTimeout(() => {
      if (!respondedRef.current) {
        respondedRef.current = true;
        setResponded(true);
        onPass();
      }
    }, effectiveTimeMs);
    return () => clearTimeout(timer);
  }, [actionKey, effectiveTimeMs, onPass]);

  const isActor = pendingAction.actorId === myPlayerId;
  if (isActor) return null;

  const actorName = players[pendingAction.actorId]?.name ?? 'Someone';
  const actionLabel = pendingAction.action.replace(/_/g, ' ');
  const animDuration = effectiveTimeMs / 1000;

  return (
    <Box
      className="relative rounded-xl p-3 sm:p-4"
      sx={{
        bgcolor: `${coupColors.surface}ee`,
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="absolute left-0 top-0 h-1 w-full overflow-hidden rounded-t-xl">
        <motion.div
          key={actionKey}
          className="h-full"
          style={{ backgroundColor: coupColors.crimsonLight }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: animDuration, ease: 'linear' }}
        />
      </div>

      <Stack spacing={1.5}>
        <Typography
          variant="body2"
          sx={{ color: coupColors.textSecondary, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}
        >
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

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            disabled={disabled || responded}
            onClick={handleChallenge}
            sx={{
              background: `linear-gradient(135deg, ${coupColors.crimson}, ${coupColors.crimsonLight})`,
              '&:hover': { background: `linear-gradient(135deg, ${coupColors.crimsonLight}, ${coupColors.crimson})` },
              fontWeight: 700,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            Challenge
          </Button>

          {blockOptions.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              disabled={disabled || responded}
              onClick={(e) => setBlockAnchor(e.currentTarget)}
              sx={{
                borderColor: coupColors.gold,
                color: coupColors.gold,
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                px: { xs: 1.5, sm: 2 },
                '&:hover': { bgcolor: `${coupColors.gold}0a` },
              }}
            >
              Block
            </Button>
          )}

          <Button
            variant="text"
            size="small"
            disabled={disabled || responded}
            onClick={handlePass}
            sx={{
              color: coupColors.textMuted,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
            }}
          >
            Pass
          </Button>
        </Stack>
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
            onClick={() => {
              handleBlock(card);
              setBlockAnchor(null);
            }}
            sx={{ color: coupColors.textPrimary, '&:hover': { bgcolor: `${coupColors.gold}12` } }}
          >
            {card}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
