import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { coupColors } from '../theme/ThemeProvider';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReturn = (): void => {
    window.location.replace('/');
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        className="flex min-h-screen items-center justify-center p-4"
        sx={{ bgcolor: coupColors.charcoal }}
      >
        <Paper
          elevation={8}
          sx={{
            bgcolor: coupColors.navy,
            border: `1px solid ${coupColors.crimson}40`,
            borderRadius: 3,
            p: 5,
            maxWidth: 440,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{ color: coupColors.crimsonLight, fontWeight: 800, mb: 2, fontFamily: '"Cinzel", serif' }}
          >
            Something went wrong
          </Typography>
          <Typography variant="body2" sx={{ color: coupColors.textMuted, mb: 3, wordBreak: 'break-word' }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReturn}
            sx={{
              background: `linear-gradient(135deg, ${coupColors.crimson}, ${coupColors.crimsonLight})`,
              '&:hover': { background: `linear-gradient(135deg, ${coupColors.crimsonLight}, ${coupColors.crimson})` },
              fontWeight: 700,
              px: 4,
            }}
          >
            Return Home
          </Button>
        </Paper>
      </Box>
    );
  }
}
