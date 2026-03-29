import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  TextField,
  Tooltip,
  Typography,
  Stack,
  Snackbar,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { useCoupTheme } from '../../theme/ThemeProvider';
import { useSoundEffects } from '../../hooks/useSoundEffects';

export default function LobbyRoom() {
  const { state } = useGame();
  const { socket } = useSocket();
  const { colors } = useCoupTheme();
  const { play } = useSoundEffects();

  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  const roomCode = state.roomCode ?? '';
  const alreadyJoined = !!state.myPlayerId;
  const players = state.lobbyPlayers;
  const isHost = players.length > 0 && state.myPlayerId === players[0].id;

  const handleJoin = () => {
    if (!socket || !name.trim() || !roomCode) return;
    play('click');
    socket.emit('join_room', { roomCode, playerName: name.trim() });
  };

  const handleStart = () => {
    if (!socket || !roomCode) return;
    play('dramatic');
    socket.emit('start_game', { roomCode });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    play('coin');
  };

  return (
    <Box
      className="flex min-h-screen items-center justify-center p-4"
      sx={{ bgcolor: colors.charcoal }}
    >
      {/* Background glow */}
      <Box
        className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        sx={{
          width: 500,
          height: 500,
          background: `radial-gradient(ellipse, rgba(139,26,43,0.08) 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
        className="relative z-10"
      >
        <Paper
          elevation={12}
          className="w-full max-w-lg rounded-2xl p-8"
          sx={{
            bgcolor: colors.navy,
            border: `1px solid rgba(255,255,255,0.06)`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Room code */}
          <Box className="mb-2 flex items-center justify-center gap-2">
            <Typography
              variant="h3"
              sx={{
                color: colors.gold,
                fontWeight: 900,
                fontFamily: '"Cinzel", serif',
                letterSpacing: 10,
                textShadow: '0 0 20px rgba(201,168,76,0.2)',
              }}
            >
              {roomCode}
            </Typography>
            <Tooltip title="Copy room code">
              <IconButton
                onClick={handleCopy}
                size="small"
                sx={{ color: colors.textMuted, '&:hover': { color: colors.gold } }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography
            variant="body2"
            className="mb-6 text-center"
            sx={{ color: colors.textMuted }}
          >
            Share this code with friends to join
          </Typography>

          {/* Decorative divider */}
          <Box
            className="mx-auto mb-6 h-px w-32"
            sx={{ background: `linear-gradient(90deg, transparent, ${colors.gold}40, transparent)` }}
          />

          {/* Join form */}
          {!alreadyJoined && (
            <Stack spacing={2} className="mb-6">
              <TextField
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                inputProps={{ maxLength: 30 }}
                fullWidth
                onFocus={() => play('hover')}
              />
              <Button
                variant="contained"
                fullWidth
                disabled={!name.trim()}
                onClick={handleJoin}
                onMouseEnter={() => play('hover')}
                sx={{
                  background: `linear-gradient(135deg, ${colors.crimson}, ${colors.crimsonLight})`,
                  '&:hover': { background: `linear-gradient(135deg, ${colors.crimsonLight}, ${colors.crimson})` },
                  fontWeight: 700,
                  py: 1.2,
                }}
              >
                Join Room
              </Button>
            </Stack>
          )}

          {/* Player list */}
          {alreadyJoined && (
            <>
              <Typography
                variant="subtitle2"
                sx={{ color: colors.textMuted, mb: 1.5, letterSpacing: 2, fontSize: '0.7rem' }}
              >
                PLAYERS ({players.length})
              </Typography>

              <List dense disablePadding>
                <AnimatePresence initial={false}>
                  {players.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          bgcolor: p.id === state.myPlayerId
                            ? `${colors.gold}10`
                            : 'rgba(255,255,255,0.02)',
                          border: p.id === state.myPlayerId
                            ? `1px solid ${colors.gold}25`
                            : '1px solid transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={() => play('hover')}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: idx === 0 ? colors.gold : colors.surface,
                              color: idx === 0 ? colors.charcoal : colors.textPrimary,
                              width: 32,
                              height: 32,
                              fontSize: '0.8rem',
                            }}
                          >
                            <PersonIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                              {p.name}
                              {idx === 0 && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, color: colors.gold, opacity: 0.8, fontSize: '0.65rem', letterSpacing: 1 }}
                                >
                                  HOST
                                </Typography>
                              )}
                              {p.id === state.myPlayerId && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, color: colors.textMuted, fontSize: '0.65rem' }}
                                >
                                  (you)
                                </Typography>
                              )}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </List>

              {/* Start button */}
              <Box className="mt-5">
                {isHost ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={players.length < 2}
                      onClick={handleStart}
                      onMouseEnter={() => play('hover')}
                      sx={{
                        background: `linear-gradient(135deg, ${colors.crimson} 0%, ${colors.crimsonLight} 100%)`,
                        '&:hover': { background: `linear-gradient(135deg, ${colors.crimsonLight} 0%, ${colors.crimson} 100%)` },
                        fontWeight: 700,
                        py: 1.5,
                        fontSize: '1rem',
                        letterSpacing: 1,
                        boxShadow: `0 4px 20px rgba(139,26,43,0.3)`,
                      }}
                    >
                      Start Game ({players.length} players)
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Typography
                      variant="body2"
                      className="text-center"
                      sx={{ color: colors.textMuted, fontStyle: 'italic' }}
                    >
                      Waiting for the host to start...
                    </Typography>
                  </motion.div>
                )}
              </Box>
            </>
          )}
        </Paper>
      </motion.div>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Room code copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
