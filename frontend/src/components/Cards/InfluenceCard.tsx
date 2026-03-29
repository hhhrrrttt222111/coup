import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion, type Variants } from 'framer-motion';
import type { CardType } from '../../types';
import { coupColors } from '../../theme/ThemeProvider';
import CharacterAvatar from './CharacterAvatars';

interface CharacterMeta {
  description: string;
  color: string;
  accent: string;
  gradient: string;
}

const CHARACTER_INFO: Record<CardType, CharacterMeta> = {
  Duke: {
    description: 'Tax — take 3 coins. Blocks Foreign Aid.',
    color: '#4a2060',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(145deg, #4a2060 0%, #2d1540 50%, #1a0a2e 100%)',
  },
  Assassin: {
    description: 'Assassinate — pay 3, kill an influence.',
    color: '#1a1a2e',
    accent: '#6b7280',
    gradient: 'linear-gradient(145deg, #1a1a2e 0%, #111122 50%, #0a0a18 100%)',
  },
  Contessa: {
    description: 'Blocks Assassination.',
    color: '#5c1018',
    accent: '#ef4444',
    gradient: 'linear-gradient(145deg, #5c1018 0%, #3d0b10 50%, #2a0608 100%)',
  },
  Captain: {
    description: 'Steal — take 2 coins. Blocks Steal.',
    color: '#1a3a4a',
    accent: '#3b82f6',
    gradient: 'linear-gradient(145deg, #1a3a4a 0%, #0f2535 50%, #081a28 100%)',
  },
  Ambassador: {
    description: 'Exchange — swap cards. Blocks Steal.',
    color: '#1a3a2a',
    accent: '#22c55e',
    gradient: 'linear-gradient(145deg, #1a3a2a 0%, #0f251a 50%, #081a10 100%)',
  },
};

export { CHARACTER_INFO };

const flipVariants: Variants = {
  faceDown: { rotateY: 180, transition: { duration: 0.5 } },
  faceUp: { rotateY: 0, transition: { duration: 0.5 } },
};

const hoverVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.04, transition: { type: 'spring', stiffness: 300 } },
};

export interface InfluenceCardProps {
  card: CardType | null;
  isRevealed: boolean;
  isSelectable?: boolean;
  isDead?: boolean;
  onSelect?: (card: CardType) => void;
  onCardClick?: (card: CardType) => void;
  compact?: boolean;
}

export default function InfluenceCard({
  card,
  isRevealed,
  isSelectable = false,
  isDead = false,
  onSelect,
  onCardClick,
  compact = false,
}: InfluenceCardProps) {
  const showFace = isRevealed && card !== null;
  const meta = card ? CHARACTER_INFO[card] : null;

  const handleClick = () => {
    if (isSelectable && card && onSelect) {
      onSelect(card);
      return;
    }
    if (showFace && card && onCardClick) {
      onCardClick(card);
    }
  };

  const isClickable = isSelectable || (showFace && !!onCardClick);

  const cardHeight = compact ? 'h-32' : 'h-40';
  const cardWidth = compact ? 'w-[5.5rem]' : 'w-28';
  const avatarSize = compact ? 36 : 44;

  return (
    <motion.div
      variants={hoverVariants}
      initial="idle"
      whileHover={isClickable ? 'hover' : undefined}
      style={{ perspective: 800 }}
    >
      <motion.div
        className={`relative ${cardHeight} ${cardWidth} select-none ${
          isClickable ? 'cursor-pointer' : 'cursor-default'
        }`}
        variants={flipVariants}
        animate={showFace ? 'faceUp' : 'faceDown'}
        style={{
          transformStyle: 'preserve-3d',
          ...(isSelectable
            ? {
                boxShadow: `0 0 0 2px ${coupColors.gold}, 0 0 12px rgba(201,168,76,0.3)`,
                borderRadius: 12,
              }
            : {}),
        }}
        onClick={handleClick}
      >
        {/* Face-down (back) */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(135deg, ${coupColors.navy} 0%, ${coupColors.surface} 50%, ${coupColors.navy} 100%)`,
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          <Box className="flex flex-col items-center gap-1">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1.5px solid rgba(201,168,76,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  color: 'rgba(201,168,76,0.4)',
                  fontWeight: 900,
                  fontSize: '1rem',
                  fontFamily: '"Cinzel Decorative", serif',
                  userSelect: 'none',
                }}
              >
                ?
              </Typography>
            </Box>
            <Typography
              sx={{
                color: 'rgba(201,168,76,0.15)',
                fontSize: '0.5rem',
                letterSpacing: 3,
                fontFamily: '"Cinzel", serif',
                userSelect: 'none',
              }}
            >
              COUP
            </Typography>
          </Box>
        </div>

        {/* Face-up (front) */}
        <Card
          className="absolute inset-0 rounded-xl"
          sx={{
            backfaceVisibility: 'hidden',
            background: meta?.gradient ?? coupColors.navy,
            border: `2px solid ${meta?.accent ?? 'rgba(255,255,255,0.2)'}`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: `0 0 20px ${meta?.accent ?? 'transparent'}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
            opacity: isDead ? 0.5 : 1,
            filter: isDead ? 'grayscale(0.6)' : 'none',
            overflow: 'hidden',
          }}
          elevation={4}
        >
          {isDead && (
            <Box
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: 'rgba(239,68,68,0.85)',
                borderRadius: '4px',
                px: 0.6,
                py: 0.15,
                zIndex: 2,
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '0.45rem',
                  fontWeight: 800,
                  letterSpacing: 1,
                  fontFamily: '"Raleway", sans-serif',
                  lineHeight: 1.4,
                }}
              >
                REVEALED
              </Typography>
            </Box>
          )}

          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: '8px !important',
              overflow: 'hidden',
            }}
          >
            {card && (
              <Box sx={{ mb: 0.5, flexShrink: 0 }}>
                <CharacterAvatar card={card} size={avatarSize} />
              </Box>
            )}
            <Typography
              sx={{
                color: meta?.accent ?? '#fff',
                fontWeight: 800,
                fontSize: compact ? '0.6rem' : '0.7rem',
                lineHeight: 1.2,
                fontFamily: '"Cinzel", serif',
                letterSpacing: 0.5,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              {card}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.55)',
                mt: 0.3,
                fontSize: compact ? '0.45rem' : '0.5rem',
                lineHeight: 1.25,
                textAlign: 'center',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: compact ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
                width: '100%',
                px: 0.25,
              }}
            >
              {meta?.description}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
