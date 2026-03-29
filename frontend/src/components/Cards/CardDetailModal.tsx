import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import { coupColors } from '../../theme/ThemeProvider';
import CharacterAvatar from './CharacterAvatars';
import { CHARACTER_INFO } from './InfluenceCard';
import type { CardType } from '../../types';

interface CharacterDetail {
  power: string;
  action: string;
  counteraction: string;
  flavour: string;
}

const CHARACTER_DETAILS: Record<CardType, CharacterDetail> = {
  Duke: {
    power: 'Tax',
    action: 'Take 3 coins from the treasury.',
    counteraction: 'Blocks Foreign Aid.',
    flavour: 'A powerful noble who controls the flow of wealth in the city-state.',
  },
  Assassin: {
    power: 'Assassinate',
    action: 'Pay 3 coins to force another player to lose an influence.',
    counteraction: 'None.',
    flavour: 'A deadly hired killer lurking in the shadows, waiting to strike.',
  },
  Contessa: {
    power: 'Block Assassination',
    action: 'No special action.',
    counteraction: 'Blocks Assassination attempts against you.',
    flavour: 'A political figure with immunity from the assassin\'s blade.',
  },
  Captain: {
    power: 'Steal',
    action: 'Take 2 coins from another player.',
    counteraction: 'Blocks Stealing.',
    flavour: 'A cunning military officer who takes what he wants by force.',
  },
  Ambassador: {
    power: 'Exchange',
    action: 'Draw 2 cards from the Court deck, choose which to keep.',
    counteraction: 'Blocks Stealing.',
    flavour: 'A diplomatic envoy with connections throughout the Court.',
  },
};

export interface CardDetailModalProps {
  card: CardType | null;
  open: boolean;
  onClose: () => void;
}

export default function CardDetailModal({ card, open, onClose }: CardDetailModalProps) {
  if (!card) return null;

  const meta = CHARACTER_INFO[card];
  const detail = CHARACTER_DETAILS[card];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: meta.color,
          background: meta.gradient,
          border: `2px solid ${meta.accent}50`,
          borderRadius: 4,
          overflow: 'visible',
          mx: 2,
        },
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 22 }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'rgba(255,255,255,0.5)',
            zIndex: 2,
            '&:hover': { color: '#fff' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <DialogContent sx={{ pt: 4, pb: 4, px: { xs: 3, sm: 3.5 } }}>
          {/* Avatar + name */}
          <Box className="flex flex-col items-center" sx={{ mb: 3 }}>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CharacterAvatar card={card} size={80} />
            </motion.div>
            <Typography
              sx={{
                color: meta.accent,
                fontFamily: '"Cinzel Decorative", serif',
                fontWeight: 700,
                fontSize: { xs: '1.3rem', sm: '1.5rem' },
                mt: 2,
                letterSpacing: 2,
              }}
            >
              {card}
            </Typography>
            <Box
              sx={{
                bgcolor: `${meta.accent}20`,
                border: `1px solid ${meta.accent}40`,
                borderRadius: 2,
                px: 1.5,
                py: 0.4,
                mt: 1,
              }}
            >
              <Typography
                sx={{
                  color: meta.accent,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {detail.power}
              </Typography>
            </Box>
          </Box>

          {/* Flavour text */}
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: { xs: '0.78rem', sm: '0.83rem' },
              textAlign: 'center',
              fontStyle: 'italic',
              lineHeight: 1.7,
              px: 1,
            }}
          >
            &ldquo;{detail.flavour}&rdquo;
          </Typography>

          {/* Divider */}
          <Box
            className="mx-auto"
            sx={{
              height: 1,
              width: '60%',
              my: 3,
              background: `linear-gradient(90deg, transparent, ${meta.accent}40, transparent)`,
            }}
          />

          {/* Action */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                color: coupColors.gold,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: 2,
                mb: 0.8,
                fontFamily: '"Cinzel", serif',
              }}
            >
              ACTION
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                lineHeight: 1.6,
              }}
            >
              {detail.action}
            </Typography>
          </Box>

          {/* Counteraction */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                color: coupColors.crimsonLight,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: 2,
                mb: 0.8,
                fontFamily: '"Cinzel", serif',
              }}
            >
              COUNTERACTION
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                lineHeight: 1.6,
              }}
            >
              {detail.counteraction}
            </Typography>
          </Box>

          {/* Quick ref */}
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.25)',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography
              sx={{
                color: meta.accent,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: 2,
                mb: 1,
                fontFamily: '"Cinzel", serif',
              }}
            >
              QUICK REFERENCE
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.78rem', sm: '0.83rem' },
                lineHeight: 1.6,
              }}
            >
              {meta.description}
            </Typography>
          </Box>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}
