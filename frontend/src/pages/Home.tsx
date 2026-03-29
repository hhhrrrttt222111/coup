import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  type SelectChangeEvent,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { createRoom, joinRoom, isApiError } from '../api/roomApi';
import { storeSession } from '../types/session';
import { useCoupTheme } from '../theme/ThemeProvider';
import { useSoundEffects } from '../hooks/useSoundEffects';
import CharacterAvatar from '../components/Cards/CharacterAvatars';
import type { CardType } from '../types';

interface HomeFormState {
  playerName: string;
  maxPlayers: number;
  joinCode: string;
  mode: 'create' | 'join' | null;
  loading: boolean;
  error: string | null;
}

const initialForm: HomeFormState = {
  playerName: '',
  maxPlayers: 6,
  joinCode: '',
  mode: null,
  loading: false,
  error: null,
};

interface CharacterShowcase {
  name: CardType;
  power: string;
  description: string;
  accent: string;
}

const CHARACTERS: CharacterShowcase[] = [
  { name: 'Duke', power: 'Tax', description: 'Takes 3 coins from the treasury. Blocks Foreign Aid.', accent: '#8b5cf6' },
  { name: 'Assassin', power: 'Assassinate', description: 'Pays 3 coins to eliminate an influence.', accent: '#6b7280' },
  { name: 'Contessa', power: 'Block', description: 'Blocks assassination attempts.', accent: '#ef4444' },
  { name: 'Captain', power: 'Steal', description: 'Takes 2 coins from another player. Blocks stealing.', accent: '#3b82f6' },
  { name: 'Ambassador', power: 'Exchange', description: 'Swaps cards with the Court deck. Blocks stealing.', accent: '#22c55e' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 22 } },
};

function DividerLine() {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
      className="mx-auto h-px w-48"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)',
      }}
    />
  );
}

export default function Home() {
  const [form, setForm] = useState<HomeFormState>(initialForm);
  const [showCharacters, setShowCharacters] = useState(false);
  const navigate = useNavigate();
  const { colors } = useCoupTheme();
  const { play } = useSoundEffects();

  useEffect(() => {
    play('ambient_start');
  }, [play]);

  const patch = (partial: Partial<HomeFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const extractError = (e: unknown): string => {
    if (isApiError(e)) return e.response?.data?.error ?? 'Something went wrong';
    return 'Something went wrong';
  };

  const handleCreate = async () => {
    if (!form.playerName.trim()) {
      play('error');
      return patch({ error: 'Enter your name' });
    }
    patch({ loading: true, error: null });
    play('click');

    try {
      const res = await createRoom({
        playerName: form.playerName.trim(),
        maxPlayers: form.maxPlayers,
      });
      storeSession({
        playerId: res.playerId,
        playerName: form.playerName.trim(),
        roomCode: res.roomCode,
      });
      play('navigate');
      navigate(`/room/${res.roomCode}`);
    } catch (e) {
      play('error');
      patch({ loading: false, error: extractError(e) });
    }
  };

  const handleJoin = async () => {
    const code = form.joinCode.trim().toUpperCase();
    if (!form.playerName.trim()) {
      play('error');
      return patch({ error: 'Enter your name' });
    }
    if (code.length < 4) {
      play('error');
      return patch({ error: 'Enter a valid room code' });
    }
    patch({ loading: true, error: null });
    play('click');

    try {
      const res = await joinRoom({ code, playerName: form.playerName.trim() });
      storeSession({
        playerId: res.playerId,
        playerName: form.playerName.trim(),
        roomCode: code,
      });
      play('navigate');
      navigate(`/room/${code}`);
    } catch (e) {
      play('error');
      patch({ loading: false, error: extractError(e) });
    }
  };

  return (
    <Box
      className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-3 py-6 sm:px-4 sm:py-8"
      sx={{
        bgcolor: colors.charcoal,
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(139,26,43,0.12) 0%, transparent 60%),
          radial-gradient(ellipse at 20% 80%, rgba(74,158,161,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 60%, rgba(201,168,76,0.04) 0%, transparent 50%),
          linear-gradient(180deg, ${colors.charcoal} 0%, #0a1018 100%)
        `,
      }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex w-full max-w-lg flex-col items-center"
      >
        {/* Title */}
        <motion.div variants={item} className="mb-2 text-center">
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.8rem', sm: '4rem' },
                letterSpacing: { xs: 8, sm: 12 },
                color: colors.gold,
                textShadow: '0 0 40px rgba(201,168,76,0.3), 0 0 80px rgba(201,168,76,0.1)',
                fontFamily: '"Cinzel Decorative", serif',
                fontWeight: 900,
              }}
            >
              COUP
            </Typography>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div variants={item} className="mb-4 text-center sm:mb-6">
          <Typography
            variant="subtitle1"
            sx={{
              color: colors.textSecondary,
              letterSpacing: { xs: 4, sm: 6 },
              fontSize: { xs: '0.7rem', sm: '0.85rem' },
              fontWeight: 500,
            }}
          >
            BLUFF &middot; DECEIVE &middot; ELIMINATE
          </Typography>
        </motion.div>

        <motion.div variants={item}>
          <DividerLine />
        </motion.div>

        {/* Description */}
        <motion.div variants={item} className="mb-6 mt-4 text-center sm:mb-8 sm:mt-6">
          <Typography
            variant="body1"
            sx={{
              color: colors.textSecondary,
              maxWidth: 420,
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              px: 1,
            }}
          >
            In the corrupt city-state of Coup, you are the head of a powerful family.
            Manipulate, bluff, and bribe your way to power. Destroy the influence of
            all rival families to claim victory.
          </Typography>
        </motion.div>

        {/* Characters showcase toggle */}
        <motion.div variants={item} className="mb-4 w-full sm:mb-6">
          <Button
            variant="text"
            fullWidth
            onClick={() => {
              setShowCharacters(!showCharacters);
              play('click');
            }}
            sx={{
              color: colors.teal,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              letterSpacing: 2,
              py: 1,
              '&:hover': { bgcolor: 'rgba(74,158,161,0.08)' },
            }}
          >
            {showCharacters ? 'HIDE CHARACTERS' : 'MEET THE CHARACTERS'}
          </Button>

          <AnimatePresence>
            {showCharacters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <Stack spacing={1.5} className="mt-3">
                  {CHARACTERS.map((char, i) => (
                    <motion.div
                      key={char.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                    >
                      <Box
                        className="flex items-center gap-3 rounded-lg p-2.5 sm:p-3"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(201,168,76,0.15)' },
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={() => play('hover')}
                      >
                        <Box sx={{ flexShrink: 0 }}>
                          <CharacterAvatar card={char.name} size={40} />
                        </Box>
                        <Box className="min-w-0">
                          <Typography
                            variant="body2"
                            sx={{
                              color: char.accent,
                              fontWeight: 700,
                              fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            }}
                          >
                            {char.name}
                            <Typography
                              component="span"
                              sx={{
                                color: colors.teal,
                                ml: 1,
                                fontSize: '0.65rem',
                                fontWeight: 500,
                              }}
                            >
                              {char.power}
                            </Typography>
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.textMuted,
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              lineHeight: 1.4,
                              display: 'block',
                            }}
                          >
                            {char.description}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={item} className="w-full">
          <DividerLine />
        </motion.div>

        {/* Name input */}
        <motion.div variants={item} className="mt-4 w-full sm:mt-6">
          <TextField
            label="Your Name"
            variant="outlined"
            fullWidth
            value={form.playerName}
            onChange={(e) => patch({ playerName: e.target.value })}
            inputProps={{ maxLength: 30 }}
            onFocus={() => play('hover')}
          />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {form.error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="w-full"
            >
              <Alert
                severity="error"
                variant="filled"
                onClose={() => patch({ error: null })}
                sx={{ mt: 2, bgcolor: colors.crimson }}
              >
                {form.error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Room card */}
        <motion.div variants={item} className="mt-3 w-full sm:mt-4">
          <Card
            component={motion.div}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            sx={{
              bgcolor: form.mode === 'create' ? 'rgba(139,26,43,0.08)' : colors.navy,
              border: form.mode === 'create'
                ? `2px solid ${colors.crimson}`
                : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: form.mode === 'create' ? colors.crimson : 'rgba(201,168,76,0.2)',
              },
            }}
            onClick={() => {
              patch({ mode: 'create' });
              play('click');
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box className="flex items-center gap-3">
                <Box
                  className="flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                  sx={{
                    background: `linear-gradient(135deg, ${colors.crimson}, ${colors.crimsonLight})`,
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, fontFamily: '"Cinzel", serif' }}>+</Typography>
                </Box>
                <Box className="min-w-0">
                  <Typography variant="h6" sx={{ color: colors.gold, fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Create a Room
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textMuted, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Start a new game and invite friends
                  </Typography>
                </Box>
              </Box>

              <AnimatePresence>
                {form.mode === 'create' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <Stack spacing={2} className="mt-4" onClick={(e) => e.stopPropagation()}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Max Players</InputLabel>
                        <Select
                          value={String(form.maxPlayers)}
                          label="Max Players"
                          onChange={(e: SelectChangeEvent) => patch({ maxPlayers: Number(e.target.value) })}
                        >
                          {[2, 3, 4, 5, 6].map((n) => (
                            <MenuItem key={n} value={String(n)}>{n} players</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={form.loading || !form.playerName.trim()}
                        onClick={handleCreate}
                        onMouseEnter={() => play('hover')}
                        sx={{
                          background: `linear-gradient(135deg, ${colors.crimson} 0%, ${colors.crimsonLight} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${colors.crimsonLight} 0%, ${colors.crimson} 100%)`,
                          },
                          fontWeight: 700,
                          py: 1.5,
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          letterSpacing: 1,
                        }}
                      >
                        {form.loading ? 'Creating...' : 'Create Room'}
                      </Button>
                    </Stack>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Join Room card */}
        <motion.div variants={item} className="mt-3 w-full">
          <Card
            component={motion.div}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            sx={{
              bgcolor: form.mode === 'join' ? 'rgba(74,158,161,0.06)' : colors.navy,
              border: form.mode === 'join'
                ? `2px solid ${colors.teal}`
                : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: form.mode === 'join' ? colors.teal : 'rgba(201,168,76,0.2)',
              },
            }}
            onClick={() => {
              patch({ mode: 'join' });
              play('click');
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box className="flex items-center gap-3">
                <Box
                  className="flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                  sx={{
                    background: `linear-gradient(135deg, ${colors.tealDark}, ${colors.teal})`,
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: 800 }}>&#8594;</Typography>
                </Box>
                <Box className="min-w-0">
                  <Typography variant="h6" sx={{ color: colors.gold, fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Join a Room
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textMuted, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Enter a room code to join an existing game
                  </Typography>
                </Box>
              </Box>

              <AnimatePresence>
                {form.mode === 'join' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <Stack spacing={2} className="mt-4" onClick={(e) => e.stopPropagation()}>
                      <TextField
                        label="Room Code"
                        variant="outlined"
                        fullWidth
                        value={form.joinCode}
                        onChange={(e) => patch({ joinCode: e.target.value.toUpperCase() })}
                        onFocus={() => play('hover')}
                        inputProps={{
                          maxLength: 6,
                          style: {
                            textAlign: 'center',
                            letterSpacing: 8,
                            fontFamily: '"Cinzel", serif',
                            fontSize: '1.3rem',
                            fontWeight: 700,
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={form.loading || !form.playerName.trim() || form.joinCode.length < 4}
                        onClick={handleJoin}
                        onMouseEnter={() => play('hover')}
                        sx={{
                          background: `linear-gradient(135deg, ${colors.tealDark} 0%, ${colors.teal} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.tealDark} 100%)`,
                          },
                          fontWeight: 700,
                          py: 1.5,
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          letterSpacing: 1,
                        }}
                      >
                        {form.loading ? 'Joining...' : 'Join Room'}
                      </Button>
                    </Stack>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rules link */}
        <motion.div variants={item} className="mt-4 w-full sm:mt-6">
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              play('click');
              navigate('/rules');
            }}
            sx={{
              borderColor: `${colors.gold}30`,
              color: colors.gold,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              letterSpacing: 2,
              py: 1.2,
              '&:hover': {
                borderColor: colors.gold,
                bgcolor: `${colors.gold}08`,
              },
            }}
          >
            VIEW RULES & CHARACTERS
          </Button>
        </motion.div>

        {/* Rules summary */}
        <motion.div variants={item} className="mt-4 w-full text-center sm:mt-6">
          <Typography
            variant="caption"
            sx={{
              color: colors.textMuted,
              display: 'block',
              lineHeight: 1.8,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            }}
          >
            2-6 players &middot; Claim roles, call bluffs, and be the last one standing.
            <br />
            Every action can be challenged. Every claim can be a lie.
          </Typography>
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          variants={item}
          className="mt-4 sm:mt-6"
        >
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
              <path d="M0 10 L20 2 L30 10 L40 2 L60 10" stroke="rgba(201,168,76,0.3)" strokeWidth="1" fill="none" />
              <path d="M0 10 L20 18 L30 10 L40 18 L60 10" stroke="rgba(201,168,76,0.3)" strokeWidth="1" fill="none" />
              <circle cx="30" cy="10" r="2" fill="rgba(201,168,76,0.4)" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </Box>
  );
}
