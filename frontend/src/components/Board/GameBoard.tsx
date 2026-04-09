import { useMemo, useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Drawer } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useNavigate } from 'react-router-dom';
import { useGame, isMyTurn, getMyPlayer, getAlivePlayers } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { coupColors } from '../../theme/ThemeProvider';
import useActions from '../../hooks/useActions';
import PlayerSeat from './PlayerSeat';
import ActionPanel, { getAvailableActions } from '../Actions/ActionPanel';
import ChallengeBar from '../Actions/ChallengeBar';
import GameLog from '../UI/GameLog';
import WinnerModal from '../UI/WinnerModal';
import CardDetailModal from '../Cards/CardDetailModal';
import type { CardType, PlayerCard, PlayerState } from '../../types';

const BLOCK_CARDS: Record<string, readonly CardType[]> = {
  foreign_aid: ['Duke'],
  assassinate: ['Contessa'],
  steal: ['Captain', 'Ambassador'],
};

function ExchangePanel({
  exchangeCards,
  keepCount,
  onConfirm,
}: {
  exchangeCards: CardType[];
  keepCount: number;
  onConfirm: (selected: CardType[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = useCallback(
    (idx: number) => {
      setSelected((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : prev.length < keepCount ? [...prev, idx] : prev,
      );
    },
    [keepCount],
  );

  const handleConfirm = useCallback(() => {
    const cards = selected.map((i) => exchangeCards[i]);
    onConfirm(cards);
  }, [selected, exchangeCards, onConfirm]);

  return (
    <Box
      className="mt-3 rounded-xl p-3 sm:p-4 text-center"
      sx={{
        bgcolor: `${coupColors.surface}ee`,
        border: `1px solid ${coupColors.gold}30`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Typography
        sx={{
          color: coupColors.gold,
          fontWeight: 700,
          mb: 1,
          fontFamily: '"Cinzel", serif',
          fontSize: { xs: '0.8rem', sm: '0.9rem' },
        }}
      >
        Exchange — pick {keepCount} card{keepCount > 1 ? 's' : ''} to keep
      </Typography>
      <Box className="mb-3 flex flex-wrap justify-center gap-2">
        {exchangeCards.map((card, i) => (
          <motion.button
            key={i}
            className="cursor-pointer rounded-lg border-2 px-3 py-2 text-white transition-colors sm:px-4 sm:py-3"
            style={{
              borderColor: selected.includes(i) ? coupColors.gold : 'rgba(255,255,255,0.15)',
              backgroundColor: selected.includes(i) ? `${coupColors.gold}15` : coupColors.charcoal,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggle(i)}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
              {card}
            </Typography>
          </motion.button>
        ))}
      </Box>
      <Button
        variant="contained"
        disabled={selected.length !== keepCount}
        onClick={handleConfirm}
        sx={{
          bgcolor: coupColors.gold,
          color: coupColors.charcoal,
          '&:hover': { bgcolor: coupColors.goldLight },
          fontWeight: 700,
          fontSize: { xs: '0.8rem', sm: '0.9rem' },
        }}
      >
        Confirm Selection
      </Button>
    </Box>
  );
}

function GameBackground() {
  return (
    <Box
      className="pointer-events-none fixed inset-0"
      sx={{ zIndex: 0 }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(139,26,43,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(74,158,161,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 60%),
            linear-gradient(180deg, ${coupColors.charcoal} 0%, #0a1018 100%)
          `,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(201,168,76,0.03) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(139,26,43,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </Box>
  );
}

export default function GameBoard() {
  const { state } = useGame();
  const { socket } = useSocket();
  const { performAction, respondToAction, loseInfluence, loading } = useActions();
  const navigate = useNavigate();
  const [logOpen, setLogOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<CardType | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const awaiting = state.awaitingResponse;
    if (!awaiting) return;
    const tick = () => setNowMs(Date.now());
    queueMicrotask(tick);
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.awaitingResponse]);

  const handlePassAction = useCallback(() => respondToAction('pass'), [respondToAction]);
  const handleChallengeAction = useCallback(() => respondToAction('challenge'), [respondToAction]);
  const handleBlockAction = useCallback((card: CardType) => respondToAction('block', card), [respondToAction]);

  const gs = state.gameState;
  const myPlayer = gs ? getMyPlayer(state) : undefined;
  const coins = myPlayer?.coins ?? 0;
  const availableActions = useMemo(() => getAvailableActions(coins), [coins]);

  if (!gs) return null;

  const myTurn = isMyTurn(state);
  const alive = getAlivePlayers(state);
  const players = Object.values(gs.players);

  const myId = state.myPlayerId ?? '';
  const currentPlayerId = gs.turnOrder[gs.currentTurnIndex];

  const cardsForPlayer = (p: PlayerState): PlayerCard[] => {
    if (p.id === myId) {
      return (state.myCards as CardType[]).map((card, i) => ({
        id: `my-${i}`,
        player_id: myId,
        card,
        is_revealed: false,
      }));
    }
    const hiddenCount = p.influenceCount ?? 0;
    return Array.from({ length: hiddenCount }, (_, i) => ({
      id: `opp-${p.id}-${i}`,
      player_id: p.id,
      card: 'Duke' as CardType,
      is_revealed: false,
    }));
  };

  const awaiting = state.awaitingResponse;
  const timeLeft = awaiting ? Math.max(0, awaiting.deadline - nowMs) : 0;
  const blockOptions: CardType[] = awaiting ? [...(BLOCK_CARDS[awaiting.action] ?? [])] : [];
  const challengeBarKey = gs.pendingAction
    ? `${gs.pendingAction.actorId}-${gs.pendingAction.action}-${gs.pendingAction.targetId ?? ''}`
    : 'challenge-bar';

  const showActionPanel = gs.phase === 'action' && myTurn;
  const showChallengeBar =
    awaiting &&
    (gs.phase === 'challenge_action' || gs.phase === 'block') &&
    awaiting.actorId !== myId;

  const showWinner = !!state.winner;

  const playersMap = gs.players;
  const nameOf = (id: unknown) => (typeof id === 'string' ? playersMap[id]?.name ?? 'Unknown' : '');

  const lastEvent = gs.events.length > 0 ? gs.events[gs.events.length - 1] : null;
  const lastActionText = (() => {
    if (!lastEvent) return null;
    const ep = lastEvent.payload;
    const actor = nameOf(ep.actorId);
    const target = nameOf(ep.targetId);
    const action = String(ep.action ?? '').replace(/_/g, ' ');
    switch (lastEvent.type) {
      case 'action_declared':
        return target ? `${actor} declared ${action} on ${target}` : `${actor} declared ${action}`;
      case 'action_resolved':
        return target ? `${actor} used ${action} on ${target}` : `${actor} used ${action}`;
      case 'influence_lost':
        return `${nameOf(ep.playerId)} lost ${ep.card}`;
      case 'game_started':
        return 'Game started!';
      default:
        return lastEvent.type.replace(/_/g, ' ');
    }
  })();

  const mePlayer = players.find((p) => p.id === myId);
  const otherPlayers = players.filter((p) => p.id !== myId);

  return (
    <Box className="relative min-h-screen" sx={{ bgcolor: coupColors.charcoal }}>
      <GameBackground />

      {/* Top bar */}
      <Box
        className="sticky top-0 z-20 flex items-center justify-between px-3 py-2 sm:px-4"
        sx={{
          bgcolor: `${coupColors.charcoal}ee`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate('/')}
          sx={{ color: coupColors.textMuted, '&:hover': { color: coupColors.gold } }}
        >
          <HomeIcon fontSize="small" />
        </IconButton>

        {/* Treasury compact */}
        <Box className="flex items-center gap-1.5">
          <Typography
            sx={{
              color: coupColors.textMuted,
              fontSize: '0.6rem',
              letterSpacing: 2,
              fontFamily: '"Cinzel", serif',
            }}
          >
            TREASURY
          </Typography>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill={coupColors.gold} stroke={coupColors.goldDark} strokeWidth="1.5" />
            <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6b4c00">
              ¢
            </text>
          </svg>
          <Typography sx={{ color: coupColors.gold, fontWeight: 800, fontSize: '0.9rem' }}>
            {50 - players.reduce((s, p) => s + p.coins, 0)}
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={() => setLogOpen(true)}
          sx={{ color: coupColors.textMuted, '&:hover': { color: coupColors.gold } }}
        >
          <MenuBookIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className="relative z-10 flex flex-col pb-4">
        {/* Last action banner */}
        {lastActionText && (
          <Box
            className="mx-3 mt-2 rounded-lg px-3 py-1.5 text-center sm:mx-4"
            sx={{
              bgcolor: `${coupColors.surface}80`,
              border: '1px solid rgba(255,255,255,0.04)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Typography sx={{ color: coupColors.textMuted, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              {lastActionText}
            </Typography>
          </Box>
        )}

        {/* Opponents grid */}
        <Box className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-2 gap-2 px-3 sm:gap-3 sm:px-4 md:grid-cols-3">
          {otherPlayers.map((p) => (
            <PlayerSeat
              key={p.id}
              player={p}
              cards={cardsForPlayer(p)}
              isCurrentTurn={p.id === currentPlayerId}
              isMe={false}
              onCardClick={setDetailCard}
            />
          ))}
        </Box>

        {/* My player seat - always at the bottom, full width on mobile */}
        {mePlayer && (
          <Box className="mx-auto mt-3 w-full max-w-3xl px-3 sm:px-4">
            <PlayerSeat
              player={mePlayer}
              cards={cardsForPlayer(mePlayer)}
              isCurrentTurn={mePlayer.id === currentPlayerId}
              isMe
              onCardClick={setDetailCard}
            />
          </Box>
        )}

        {/* Bottom panel */}
        <Box className="mx-auto mt-2 w-full max-w-3xl px-3 sm:px-4">
          <AnimatePresence mode="wait">
            {showActionPanel && (
              <motion.div
                key="action-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <ActionPanel
                  availableActions={availableActions}
                  onAction={performAction}
                  players={alive}
                  myPlayerId={myId}
                  disabled={!myTurn}
                  loading={loading as Record<string, boolean>}
                />
              </motion.div>
            )}

            {showChallengeBar && awaiting && gs.pendingAction && (
              <motion.div
                key="challenge-bar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <ChallengeBar
                  key={challengeBarKey}
                  pendingAction={gs.pendingAction}
                  timeLeft={timeLeft}
                  onChallenge={handleChallengeAction}
                  onBlock={handleBlockAction}
                  onPass={handlePassAction}
                  blockOptions={blockOptions}
                  myPlayerId={myId}
                  disabled={false}
                  players={playersMap}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lose influence prompt */}
          {gs.phase === 'lose_influence' && gs.losInfluencePlayerId === myId && (
            <Box
              className="mt-3 rounded-xl p-3 sm:p-4 text-center"
              sx={{
                bgcolor: `${coupColors.surface}ee`,
                border: `1px solid ${coupColors.crimson}40`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Typography
                sx={{
                  color: coupColors.crimsonLight,
                  fontWeight: 700,
                  mb: 1,
                  fontFamily: '"Cinzel", serif',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                }}
              >
                You must lose an influence — choose a card
              </Typography>
              <Box className="flex justify-center gap-2 sm:gap-3">
                {(state.myCards as CardType[]).map((card, i) => (
                  <motion.button
                    key={i}
                    className="cursor-pointer rounded-lg border-2 px-3 py-2 text-white transition-colors sm:px-4"
                    style={{
                      borderColor: `${coupColors.crimson}60`,
                      backgroundColor: coupColors.charcoal,
                    }}
                    whileHover={{ scale: 1.05, borderColor: coupColors.crimsonLight }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => loseInfluence(i)}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                      {card}
                    </Typography>
                  </motion.button>
                ))}
              </Box>
            </Box>
          )}

          {/* Exchange */}
          {gs.phase === 'exchange_return' && gs.exchangeCards && (
            <ExchangePanel
              exchangeCards={gs.exchangeCards as CardType[]}
              keepCount={myPlayer?.influences.length ?? 2}
              onConfirm={(selected) => {
                if (socket && state.roomCode) {
                  socket.emit('exchange_select', { roomCode: state.roomCode, selectedCards: selected });
                }
              }}
            />
          )}
          {gs.phase === 'exchange_return' && !gs.exchangeCards && (
            <Box
              className="mt-3 rounded-xl p-3 sm:p-4 text-center"
              sx={{ bgcolor: `${coupColors.surface}ee`, border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Typography variant="body2" sx={{ color: coupColors.textMuted, fontStyle: 'italic', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                {nameOf(gs.turnOrder[gs.currentTurnIndex])} is choosing cards to keep...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Game Log drawer for mobile, sidebar for desktop */}
      <Box
        className="hidden xl:block"
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 280,
          height: '100vh',
          bgcolor: `${coupColors.darkSlate}f5`,
          borderLeft: '1px solid rgba(255,255,255,0.04)',
          p: 2,
          pt: 3,
          zIndex: 15,
          backdropFilter: 'blur(12px)',
        }}
      >
        <GameLog />
      </Box>

      <Drawer
        anchor="right"
        open={logOpen}
        onClose={() => setLogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: coupColors.darkSlate,
            width: { xs: '85vw', sm: 320 },
            maxWidth: 360,
            p: 2,
            pt: 3,
          },
        }}
        className="xl:hidden"
      >
        <GameLog />
      </Drawer>

      <WinnerModal
        winner={
          state.winner ? { id: state.winner.winnerId, name: state.winner.winnerName } : null
        }
        open={showWinner}
        isMe={state.winner?.winnerId === myId}
        onPlayAgain={() => {
          if (socket && state.roomCode) {
            socket.emit('restart_game', { roomCode: state.roomCode });
          }
        }}
      />

      <CardDetailModal
        card={detailCard}
        open={!!detailCard}
        onClose={() => setDetailCard(null)}
      />
    </Box>
  );
}
