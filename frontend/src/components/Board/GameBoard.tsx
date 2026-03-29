import { useMemo, useState, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, isMyTurn, getMyPlayer, getAlivePlayers } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { coupColors } from '../../theme/ThemeProvider';
import useActions from '../../hooks/useActions';
import PlayerSeat from './PlayerSeat';
import ActionPanel, { getAvailableActions } from '../Actions/ActionPanel';
import ChallengeBar from '../Actions/ChallengeBar';
import GameLog from '../UI/GameLog';
import WinnerModal from '../UI/WinnerModal';
import type { CardType, PlayerCard, PlayerState } from '../../types';

const BLOCK_CARDS: Record<string, readonly CardType[]> = {
  foreign_aid: ['Duke'],
  assassinate: ['Contessa'],
  steal:       ['Captain', 'Ambassador'],
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

  const toggle = useCallback((idx: number) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : prev.length < keepCount ? [...prev, idx] : prev,
    );
  }, [keepCount]);

  const handleConfirm = useCallback(() => {
    const cards = selected.map((i) => exchangeCards[i]);
    onConfirm(cards);
  }, [selected, exchangeCards, onConfirm]);

  return (
    <Box
      className="mt-4 rounded-xl p-4 text-center"
      sx={{
        bgcolor: coupColors.surface,
        border: `1px solid ${coupColors.gold}30`,
      }}
    >
      <Typography variant="body1" sx={{ color: coupColors.gold, fontWeight: 700, mb: 1, fontFamily: '"Cinzel", serif' }}>
        Exchange — pick {keepCount} card{keepCount > 1 ? 's' : ''} to keep
      </Typography>
      <Box className="mb-3 flex flex-wrap justify-center gap-3">
        {exchangeCards.map((card, i) => (
          <motion.button
            key={i}
            className="cursor-pointer rounded-lg border-2 px-4 py-3 text-white transition-colors"
            style={{
              borderColor: selected.includes(i) ? coupColors.gold : 'rgba(255,255,255,0.15)',
              backgroundColor: selected.includes(i) ? `${coupColors.gold}15` : coupColors.charcoal,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggle(i)}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{card}</Typography>
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
        }}
      >
        Confirm Selection
      </Button>
    </Box>
  );
}

export default function GameBoard() {
  const { state } = useGame();
  const { socket } = useSocket();
  const { performAction, respondToAction, loseInfluence, loading } = useActions();

  const gs = state.gameState;
  const myPlayer = gs ? getMyPlayer(state) : undefined;
  const coins = myPlayer?.coins ?? 0;
  const availableActions = useMemo(() => getAvailableActions(coins), [coins]);

  if (!gs) return null;

  const myTurn   = isMyTurn(state);
  const alive    = getAlivePlayers(state);
  const players  = Object.values(gs.players);

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
  const timeLeft = awaiting ? Math.max(0, awaiting.deadline - Date.now()) : 0;
  const blockOptions: CardType[] = awaiting ? [...(BLOCK_CARDS[awaiting.action] ?? [])] : [];

  const showActionPanel = gs.phase === 'action' && myTurn;
  const showChallengeBar =
    awaiting &&
    (gs.phase === 'challenge_action' || gs.phase === 'block') &&
    awaiting.actorId !== myId;

  const showWinner = !!state.winner;

  const playersMap = gs.players;
  const nameOf = (id: unknown) => typeof id === 'string' ? (playersMap[id]?.name ?? 'Unknown') : '';

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

  return (
    <Box className="flex min-h-screen" sx={{ bgcolor: coupColors.charcoal }}>
      <Box className="flex flex-1 flex-col p-4">
        {/* Player grid */}
        <Box className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {players.map((p) => (
            <PlayerSeat
              key={p.id}
              player={p}
              cards={cardsForPlayer(p)}
              isCurrentTurn={p.id === currentPlayerId}
              isMe={p.id === myId}
            />
          ))}
        </Box>

        {/* Treasury */}
        <Box
          className="mx-auto my-6 flex w-full max-w-sm flex-col items-center gap-2 rounded-xl p-4"
          sx={{
            bgcolor: coupColors.surface,
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <Typography variant="caption" sx={{ color: coupColors.textMuted, letterSpacing: 2, fontSize: '0.65rem' }}>
            TREASURY
          </Typography>
          <Box className="flex items-center gap-1">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill={coupColors.gold} stroke={coupColors.goldDark} strokeWidth="1.5" />
              <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6b4c00">¢</text>
            </svg>
            <Typography variant="h6" sx={{ color: coupColors.gold, fontWeight: 800 }}>
              {50 - players.reduce((s, p) => s + p.coins, 0)}
            </Typography>
          </Box>
          {lastActionText && (
            <Typography variant="caption" sx={{ color: coupColors.textMuted, textAlign: 'center', fontSize: '0.7rem' }}>
              {lastActionText}
            </Typography>
          )}
        </Box>

        {/* Bottom panel */}
        <Box className="mx-auto w-full max-w-3xl">
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
                  pendingAction={gs.pendingAction}
                  timeLeft={timeLeft}
                  onChallenge={() => respondToAction('challenge')}
                  onBlock={(card: CardType) => respondToAction('block', card)}
                  onPass={() => respondToAction('pass')}
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
              className="mt-4 rounded-xl p-4 text-center"
              sx={{
                bgcolor: coupColors.surface,
                border: `1px solid ${coupColors.crimson}40`,
              }}
            >
              <Typography variant="body1" sx={{ color: coupColors.crimsonLight, fontWeight: 700, mb: 1, fontFamily: '"Cinzel", serif' }}>
                You must lose an influence — choose a card to reveal
              </Typography>
              <Box className="flex justify-center gap-3">
                {(state.myCards as CardType[]).map((card, i) => (
                  <motion.button
                    key={i}
                    className="cursor-pointer rounded-lg border-2 px-4 py-2 text-white transition-colors"
                    style={{
                      borderColor: `${coupColors.crimson}60`,
                      backgroundColor: coupColors.charcoal,
                    }}
                    whileHover={{ scale: 1.05, borderColor: coupColors.crimsonLight }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => loseInfluence(i)}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{card}</Typography>
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
              className="mt-4 rounded-xl p-4 text-center"
              sx={{ bgcolor: coupColors.surface, border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Typography variant="body2" sx={{ color: coupColors.textMuted, fontStyle: 'italic' }}>
                {nameOf(gs.turnOrder[gs.currentTurnIndex])} is choosing cards to keep...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Right sidebar */}
      <Box
        className="hidden w-80 flex-shrink-0 p-4 lg:block"
        sx={{
          bgcolor: coupColors.darkSlate,
          borderLeft: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <GameLog />
      </Box>

      <WinnerModal
        winner={
          state.winner
            ? { id: state.winner.winnerId, name: state.winner.winnerName }
            : null
        }
        open={showWinner}
        isMe={state.winner?.winnerId === myId}
        onPlayAgain={() => {
          if (socket && state.roomCode) {
            socket.emit('restart_game', { roomCode: state.roomCode });
          }
        }}
      />
    </Box>
  );
}
