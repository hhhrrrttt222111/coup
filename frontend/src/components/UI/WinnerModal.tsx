import { forwardRef, type ReactElement, type Ref } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { motion } from 'framer-motion';
import type { TransitionProps } from '@mui/material/transitions';
import { Slide } from '@mui/material';
import { coupColors } from '../../theme/ThemeProvider';

const DialogTransition = forwardRef(function DialogTransition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface WinnerModalProps {
  winner: { id: string; name: string } | null;
  open: boolean;
  isMe: boolean;
  onPlayAgain: () => void;
}

export default function WinnerModal({ winner, open, isMe, onPlayAgain }: WinnerModalProps) {
  return (
    <Dialog
      open={open}
      TransitionComponent={DialogTransition}
      PaperProps={{
        sx: {
          bgcolor: coupColors.navy,
          border: isMe
            ? `2px solid ${coupColors.gold}40`
            : `2px solid ${coupColors.crimson}40`,
          borderRadius: 4,
          overflow: 'visible',
          minWidth: 360,
        },
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <Box className="-mt-8 flex justify-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Box
              className="flex h-16 w-16 items-center justify-center rounded-full"
              sx={{
                bgcolor: isMe ? `${coupColors.gold}15` : `${coupColors.crimson}15`,
                border: isMe ? `3px solid ${coupColors.gold}` : `3px solid ${coupColors.crimsonLight}`,
                boxShadow: isMe
                  ? `0 0 30px ${coupColors.gold}30`
                  : `0 0 30px ${coupColors.crimson}30`,
              }}
            >
              <Typography sx={{ fontSize: '1.8rem', fontFamily: '"Cinzel Decorative", serif', color: isMe ? coupColors.gold : coupColors.crimsonLight }}>
                {isMe ? 'V' : 'X'}
              </Typography>
            </Box>
          </motion.div>
        </Box>

        <DialogTitle
          sx={{
            textAlign: 'center',
            color: isMe ? coupColors.gold : coupColors.crimsonLight,
            fontWeight: 900,
            fontSize: '1.6rem',
            fontFamily: '"Cinzel Decorative", serif',
            pb: 0,
            pt: 3,
          }}
        >
          {isMe ? 'Victory!' : 'Defeat'}
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
          <Typography variant="h5" sx={{ color: coupColors.textPrimary, fontWeight: 700, mt: 1, fontFamily: '"Cinzel", serif' }}>
            {winner?.name}
          </Typography>
          <Typography variant="body2" sx={{ color: coupColors.textMuted, mt: 0.5 }}>
            {isMe ? 'You are the last one standing!' : 'is the last one standing'}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="contained"
              size="large"
              onClick={onPlayAgain}
              sx={{
                background: `linear-gradient(135deg, ${coupColors.crimson}, ${coupColors.crimsonLight})`,
                '&:hover': { background: `linear-gradient(135deg, ${coupColors.crimsonLight}, ${coupColors.crimson})` },
                fontWeight: 700,
                px: 4,
                letterSpacing: 1,
              }}
            >
              Play Again
            </Button>
          </motion.div>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
}
