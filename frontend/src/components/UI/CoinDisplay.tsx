import { Box, Typography } from '@mui/material';
import { coupColors } from '../../theme/ThemeProvider';

interface CoinDisplayProps {
  coins: number;
}

export default function CoinDisplay({ coins }: CoinDisplayProps) {
  return (
    <Box className="inline-flex items-center gap-1">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill={coupColors.gold} stroke={coupColors.goldDark} strokeWidth="1.5" />
        <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6b4c00">¢</text>
      </svg>
      <Typography variant="body2" sx={{ color: coupColors.gold, fontWeight: 700 }}>
        {coins}
      </Typography>
    </Box>
  );
}
