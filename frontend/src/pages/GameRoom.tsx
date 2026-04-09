import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Snackbar, Alert, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { getRoom, isApiError } from '../api/roomApi';
import { getSession } from '../types/session';
import { useCoupTheme } from '../theme/ThemeProvider';
import LobbyRoom from '../components/Lobby/LobbyRoom';
import GameBoard from '../components/Board/GameBoard';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';

export default function GameRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { state, dispatch } = useGame();
  const { colors } = useCoupTheme();

  const [verified, setVerified] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');

  useEffect(() => {
    if (code) {
      dispatch({ type: 'SET_ROOM_CODE', payload: code });
    }
  }, [code, dispatch]);

  useEffect(() => {
    if (!code) return;
    getRoom(code)
      .then(() => setVerified(true))
      .catch((e) => {
        if (isApiError(e) && e.response?.data?.code === 'ROOM_NOT_FOUND') {
          setSnackMessage('Room not found');
        } else {
          setSnackMessage('Failed to load room');
        }
        setSnackOpen(true);
        navigate('/', { replace: true });
      });
  }, [code, navigate]);

  useEffect(() => {
    if (!verified || !connected || !socket || !code) return;

    const session = getSession();
    if (session && session.roomCode === code) {
      socket.emit('join_room', {
        roomCode: session.roomCode,
        playerName: session.playerName,
      });
    }
  }, [verified, connected, socket, code]);

  useEffect(() => {
    const d = state.disconnectedPlayer;
    if (!d) return;
    const name = d.playerName;
    queueMicrotask(() => {
      setSnackMessage(`${name} disconnected`);
      setSnackOpen(true);
      dispatch({ type: 'CLEAR_DISCONNECT' });
    });
  }, [state.disconnectedPlayer, dispatch]);

  const handleSnackClose = useCallback(() => setSnackOpen(false), []);

  const phase = state.phase;
  const inLobby = phase === 'lobby';
  const skeletonVariant = inLobby ? 'lobby' : 'game';

  return (
    <Box sx={{ bgcolor: colors.charcoal, minHeight: '100vh' }}>
      <Suspense fallback={<LoadingSkeleton variant={skeletonVariant} />}>
        {!verified ? (
          <LoadingSkeleton variant={skeletonVariant} />
        ) : inLobby ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LobbyRoom />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GameBoard />
          </motion.div>
        )}
      </Suspense>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={handleSnackClose}
          sx={{
            width: '100%',
            bgcolor: colors.crimson,
            color: colors.textPrimary,
            fontFamily: '"Raleway", sans-serif',
          }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
