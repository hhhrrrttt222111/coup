import { Card, CardContent, Typography } from '@mui/material';
import { motion, type Variants } from 'framer-motion';
import type { CardType } from '../../types';
import { coupColors } from '../../theme/ThemeProvider';

interface CharacterMeta {
  description: string;
  color: string;
  accent: string;
}

const CHARACTER_INFO: Record<CardType, CharacterMeta> = {
  Duke:       { description: 'Tax — take 3 coins. Blocks Foreign Aid.', color: '#4a2060', accent: '#8b5cf6' },
  Assassin:   { description: 'Assassinate — pay 3, kill an influence.', color: '#1a1a2e', accent: '#6b7280' },
  Contessa:   { description: 'Blocks Assassination.',                   color: '#5c1018', accent: '#ef4444' },
  Captain:    { description: 'Steal — take 2 coins. Blocks Steal.',     color: '#1a3a4a', accent: '#3b82f6' },
  Ambassador: { description: 'Exchange — swap cards. Blocks Steal.',    color: '#1a3a2a', accent: '#22c55e' },
};

const flipVariants: Variants = {
  faceDown: { rotateY: 180, transition: { duration: 0.5 } },
  faceUp:   { rotateY: 0,   transition: { duration: 0.5 } },
};

const hoverVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.06, transition: { type: 'spring', stiffness: 300 } },
};

export interface InfluenceCardProps {
  card: CardType | null;
  isRevealed: boolean;
  isSelectable?: boolean;
  onSelect?: (card: CardType) => void;
}

export default function InfluenceCard({
  card,
  isRevealed,
  isSelectable = false,
  onSelect,
}: InfluenceCardProps) {
  const showFace = isRevealed && card !== null;
  const meta = card ? CHARACTER_INFO[card] : null;

  const handleClick = () => {
    if (isSelectable && card && onSelect) {
      onSelect(card);
    }
  };

  return (
    <motion.div
      variants={hoverVariants}
      initial="idle"
      whileHover="hover"
      style={{ perspective: 800 }}
    >
      <motion.div
        className={`relative h-36 w-24 cursor-default select-none ${
          isSelectable ? 'cursor-pointer' : ''
        }`}
        variants={flipVariants}
        animate={showFace ? 'faceUp' : 'faceDown'}
        style={{
          transformStyle: 'preserve-3d',
          ...(isSelectable ? {
            boxShadow: `0 0 0 2px ${coupColors.gold}, 0 0 12px rgba(201,168,76,0.3)`,
            borderRadius: 12,
          } : {}),
        }}
        onClick={handleClick}
      >
        {/* Face-down (back) */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `repeating-linear-gradient(45deg, ${coupColors.navy} 0px, ${coupColors.navy} 10px, ${coupColors.surface} 10px, ${coupColors.surface} 20px)`,
            border: `1px solid rgba(255,255,255,0.06)`,
          }}
        >
          <Typography
            variant="h4"
            sx={{ color: 'rgba(201,168,76,0.2)', fontWeight: 900, userSelect: 'none', fontFamily: '"Cinzel Decorative", serif' }}
          >
            ?
          </Typography>
        </div>

        {/* Face-up (front) */}
        <Card
          className="absolute inset-0 rounded-xl"
          sx={{
            backfaceVisibility: 'hidden',
            bgcolor: meta?.color ?? coupColors.navy,
            border: isRevealed ? `2px solid ${meta?.accent ?? 'rgba(255,255,255,0.2)'}` : 'none',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isRevealed ? `0 0 15px ${meta?.accent ?? 'transparent'}30` : 'none',
          }}
          elevation={4}
        >
          <CardContent className="flex h-full flex-col items-center justify-center p-2 text-center">
            <Typography
              variant="subtitle2"
              sx={{
                color: meta?.accent ?? '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
                lineHeight: 1.2,
                fontFamily: '"Cinzel", serif',
                letterSpacing: 1,
              }}
            >
              {card}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, fontSize: '0.55rem', lineHeight: 1.3 }}
            >
              {meta?.description}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
