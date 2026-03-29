import { List, ListItem, ListItemText, Chip } from '@mui/material';
import { coupColors } from '../../theme/ThemeProvider';
import type { SanitizedPlayer } from '../../types';

interface PlayerListProps {
  players: readonly SanitizedPlayer[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <List dense>
      {players.map((p) => (
        <ListItem key={p.id} secondaryAction={
          <Chip
            label={`${p.coins} coins`}
            size="small"
            variant="outlined"
            sx={{ borderColor: coupColors.gold, color: coupColors.gold }}
          />
        }>
          <ListItemText primary={p.name} sx={{ color: coupColors.textPrimary }} />
        </ListItem>
      ))}
    </List>
  );
}
