import { Box, Typography } from '@mui/material';
import { motion, type Variants } from 'framer-motion';
import InfluenceCard from '../Cards/InfluenceCard';
import { coupColors } from '../../theme/ThemeProvider';
import type { PlayerState, PlayerCard } from '../../types';

function CoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" fill={coupColors.gold} stroke={coupColors.goldDark} strokeWidth="1.5" />
      <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6b4c00">
        ¢
      </text>
    </svg>
  );
}

const pulseVariants: Variants = {
  idle: { boxShadow: '0 0 0 0px rgba(139,26,43,0)' },
  active: {
    boxShadow: [
      '0 0 0 0px rgba(201,168,76,0.6)',
      '0 0 0 6px rgba(201,168,76,0)',
      '0 0 0 0px rgba(201,168,76,0)',
    ],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

export interface PlayerSeatProps {
  player: PlayerState;
  cards: PlayerCard[];
  isCurrentTurn: boolean;
  isMe: boolean;
}

export default function PlayerSeat({ player, cards, isCurrentTurn, isMe }: PlayerSeatProps) {
  return (
    <motion.div
      className={`relative rounded-xl ${isMe ? 'p-3 sm:p-4' : 'p-2 sm:p-3'} ${player.isAlive ? '' : 'grayscale'}`}
      variants={pulseVariants}
      animate={isCurrentTurn && player.isAlive ? 'active' : 'idle'}
      initial="idle"
      style={{
        backgroundColor: isMe ? `${coupColors.gold}08` : `${coupColors.navy}cc`,
        border: isMe
          ? `2px solid ${coupColors.gold}40`
          : isCurrentTurn
            ? `1px solid ${coupColors.gold}30`
            : '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {!player.isAlive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60">
          <Typography
            variant="subtitle2"
            sx={{
              color: coupColors.crimsonLight,
              fontWeight: 800,
              letterSpacing: 3,
              fontFamily: '"Cinzel", serif',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            }}
          >
            ELIMINATED
          </Typography>
        </div>
      )}

      <Box className="mb-2 flex items-center justify-between">
        <Box className="flex items-center gap-1.5 overflow-hidden">
          {isCurrentTurn && player.isAlive && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: coupColors.gold,
                flexShrink: 0,
                boxShadow: `0 0 6px ${coupColors.gold}`,
              }}
            />
          )}
          <Typography
            sx={{
              fontWeight: 700,
              color: isMe ? coupColors.gold : coupColors.textPrimary,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {player.name}
            {isMe && (
              <Typography
                component="span"
                sx={{
                  ml: 0.5,
                  color: coupColors.gold,
                  opacity: 0.6,
                  fontSize: { xs: '0.55rem', sm: '0.6rem' },
                }}
              >
                (You)
              </Typography>
            )}
          </Typography>
        </Box>

        <Box className="flex items-center gap-1" sx={{ flexShrink: 0 }}>
          <CoinIcon />
          <Typography variant="body2" sx={{ color: coupColors.gold, fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            {player.coins}
          </Typography>
        </Box>
      </Box>

      <Box className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {isMe
          ? cards.map((c) => (
              <InfluenceCard
                key={c.id}
                card={c.card}
                isRevealed
                isDead={c.is_revealed}
                compact
              />
            ))
          : cards.map((c) => (
              <InfluenceCard
                key={c.id}
                card={c.is_revealed ? c.card : null}
                isRevealed={c.is_revealed}
                isDead={c.is_revealed}
                compact
              />
            ))}

        {player.revealedCards.map((rc, i) => (
          <InfluenceCard key={`rev-${i}`} card={rc} isRevealed isDead compact />
        ))}
      </Box>
    </motion.div>
  );
}
