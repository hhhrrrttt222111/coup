import { useState } from 'react';
import {
  Button,
  Stack,
  Typography,
  Menu,
  MenuItem,
  CircularProgress,
  Chip,
} from '@mui/material';
import { ActionType, type PlayerState } from '../../types';
import { coupColors } from '../../theme/ThemeProvider';

interface ActionMeta {
  action: ActionType;
  label: string;
  cost: number;
  gain?: number;
  needsTarget: boolean;
}

const ACTION_DEFS: ActionMeta[] = [
  { action: ActionType.INCOME,      label: 'Income',                 cost: 0, gain: 1,  needsTarget: false },
  { action: ActionType.FOREIGN_AID, label: 'Foreign Aid',            cost: 0, gain: 2,  needsTarget: false },
  { action: ActionType.TAX,         label: 'Tax (Duke)',             cost: 0, gain: 3,  needsTarget: false },
  { action: ActionType.STEAL,       label: 'Steal (Captain)',        cost: 0,            needsTarget: true },
  { action: ActionType.ASSASSINATE, label: 'Assassinate',            cost: 3,            needsTarget: true },
  { action: ActionType.EXCHANGE,    label: 'Exchange (Ambassador)',  cost: 0,            needsTarget: false },
  { action: ActionType.COUP,        label: 'Coup',                   cost: 7,            needsTarget: true },
];

export function getAvailableActions(coins: number): ActionType[] {
  if (coins >= 10) return [ActionType.COUP];

  return ACTION_DEFS
    .filter((a) => {
      if (a.action === ActionType.ASSASSINATE && coins < 3) return false;
      if (a.action === ActionType.COUP && coins < 7) return false;
      return true;
    })
    .map((a) => a.action);
}

export interface ActionPanelProps {
  availableActions: ActionType[];
  onAction: (action: ActionType, targetId?: string) => void;
  players: PlayerState[];
  myPlayerId: string;
  disabled: boolean;
  loading: Record<string, boolean>;
}

export default function ActionPanel({
  availableActions,
  onAction,
  players,
  myPlayerId,
  disabled,
  loading,
}: ActionPanelProps) {
  const [targetMenuAnchor, setTargetMenuAnchor] = useState<HTMLElement | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);

  const targets = players.filter((p) => p.id !== myPlayerId && p.isAlive);

  const handleClick = (meta: ActionMeta, el: HTMLElement) => {
    if (meta.needsTarget) {
      setPendingAction(meta.action);
      setTargetMenuAnchor(el);
    } else {
      onAction(meta.action);
    }
  };

  const handleTargetSelect = (targetId: string) => {
    if (pendingAction) {
      onAction(pendingAction, targetId);
    }
    setTargetMenuAnchor(null);
    setPendingAction(null);
  };

  const visibleDefs = ACTION_DEFS.filter((a) => availableActions.includes(a.action));

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="h6"
        sx={{ color: coupColors.gold, fontWeight: 800, fontFamily: '"Cinzel", serif', fontSize: '1rem' }}
      >
        Your Turn — Choose an Action
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1}>
        {visibleDefs.map((meta) => {
          const isLoading = !!loading[meta.action];

          return (
            <Button
              key={meta.action}
              variant="outlined"
              size="small"
              disabled={disabled || isLoading}
              onClick={(e) => handleClick(meta, e.currentTarget)}
              sx={{
                borderColor: `${coupColors.gold}30`,
                color: coupColors.textPrimary,
                position: 'relative',
                '&:hover': { borderColor: coupColors.gold, bgcolor: `${coupColors.gold}0a` },
              }}
            >
              {isLoading && (
                <CircularProgress
                  size={20}
                  sx={{ color: coupColors.gold, position: 'absolute', left: '50%', ml: '-10px' }}
                />
              )}
              <span className={isLoading ? 'opacity-0' : ''}>
                {meta.label}
                {(meta.cost > 0 || meta.gain) && (
                  <Chip
                    label={meta.cost > 0 ? `-${meta.cost}` : `+${meta.gain}`}
                    size="small"
                    sx={{
                      ml: 0.5,
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: meta.cost > 0 ? `${coupColors.crimson}30` : `${coupColors.gold}20`,
                      color: meta.cost > 0 ? coupColors.crimsonLight : coupColors.gold,
                    }}
                  />
                )}
              </span>
            </Button>
          );
        })}
      </Stack>

      <Menu
        anchorEl={targetMenuAnchor}
        open={!!targetMenuAnchor}
        onClose={() => { setTargetMenuAnchor(null); setPendingAction(null); }}
      >
        <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem' }}>
          Choose a target
        </MenuItem>
        {targets.map((t) => (
          <MenuItem
            key={t.id}
            onClick={() => handleTargetSelect(t.id)}
            sx={{ color: coupColors.textPrimary, '&:hover': { bgcolor: `${coupColors.crimson}15` } }}
          >
            {t.name}
            <Chip
              label={`${t.coins}¢`}
              size="small"
              sx={{ ml: 1, height: 18, fontSize: '0.65rem', bgcolor: `${coupColors.gold}20`, color: coupColors.gold }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
