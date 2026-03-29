import { Box, Skeleton, Stack } from '@mui/material';
import { coupColors } from '../../theme/ThemeProvider';

export interface LoadingSkeletonProps {
  variant: 'lobby' | 'game';
}

const skBg = 'rgba(255,255,255,0.03)';

export default function LoadingSkeleton({ variant }: LoadingSkeletonProps) {
  if (variant === 'lobby') {
    return (
      <Box
        className="flex min-h-screen items-center justify-center p-4"
        sx={{ bgcolor: coupColors.charcoal }}
      >
        <Box className="w-full max-w-lg space-y-4">
          <Skeleton variant="text" width={180} height={48} sx={{ bgcolor: skBg, mx: 'auto' }} />
          <Skeleton variant="text" width={240} height={20} sx={{ bgcolor: skBg, mx: 'auto' }} />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ bgcolor: skBg, borderRadius: 2 }} />
          ))}
          <Skeleton variant="rounded" height={52} sx={{ bgcolor: skBg, borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-4"
      sx={{ bgcolor: coupColors.charcoal }}
    >
      <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: skBg }} />
      <Stack direction="row" spacing={2}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rounded" width={160} height={200} sx={{ bgcolor: skBg, borderRadius: 3 }} />
        ))}
      </Stack>
      <Skeleton variant="rounded" width={400} height={60} sx={{ bgcolor: skBg, borderRadius: 2 }} />
    </Box>
  );
}
