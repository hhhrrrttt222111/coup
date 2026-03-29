import { Button, Stack, Typography } from '@mui/material';
import type { CardType } from '../../types';
import { coupColors } from '../../theme/ThemeProvider';

const BLOCK_OPTIONS: Record<string, { card: CardType; label: string }[]> = {
  foreign_aid: [{ card: 'Duke',       label: 'Block as Duke' }],
  assassinate: [{ card: 'Contessa',   label: 'Block as Contessa' }],
  steal:       [
    { card: 'Captain',    label: 'Block as Captain' },
    { card: 'Ambassador', label: 'Block as Ambassador' },
  ],
};

export interface BlockPanelProps {
  action: string;
  onBlock: (card: CardType) => void;
  disabled: boolean;
}

export default function BlockPanel({ action, onBlock, disabled }: BlockPanelProps) {
  const options = BLOCK_OPTIONS[action] ?? [];
  if (options.length === 0) return null;

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ color: coupColors.textSecondary }}>
        Block this action?
      </Typography>
      <Stack direction="row" gap={1}>
        {options.map((o) => (
          <Button
            key={o.card}
            variant="outlined"
            size="small"
            disabled={disabled}
            onClick={() => onBlock(o.card)}
            sx={{
              borderColor: coupColors.gold,
              color: coupColors.gold,
              fontWeight: 700,
              '&:hover': { bgcolor: `${coupColors.gold}0a` },
            }}
          >
            {o.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
