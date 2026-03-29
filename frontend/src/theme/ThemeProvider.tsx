import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, type Theme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

const coupColors = {
  charcoal: '#0f1923',
  darkSlate: '#151d2b',
  navy: '#1a2332',
  surface: '#1e2a3a',
  crimson: '#8b1a2b',
  crimsonLight: '#b22234',
  crimsonDark: '#5c1018',
  gold: '#c9a84c',
  goldLight: '#dfc06e',
  goldDark: '#a08030',
  teal: '#4a9ea1',
  tealLight: '#6cc4c7',
  tealDark: '#2e7a7d',
  silver: '#8a95a5',
  silverLight: '#b0bac8',
  textPrimary: '#e8e0d4',
  textSecondary: '#8a95a5',
  textMuted: '#5a6577',
} as const;

export type CoupColors = typeof coupColors;

interface CoupThemeContextValue {
  colors: CoupColors;
  muiTheme: Theme;
}

const CoupThemeContext = createContext<CoupThemeContextValue | null>(null);

export function useCoupTheme(): CoupThemeContextValue {
  const ctx = useContext(CoupThemeContext);
  if (!ctx) throw new Error('useCoupTheme must be used within <CoupThemeProvider>');
  return ctx;
}

export function CoupThemeProvider({ children }: { children: ReactNode }) {
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary: { main: coupColors.crimson, light: coupColors.crimsonLight, dark: coupColors.crimsonDark },
          secondary: { main: coupColors.gold, light: coupColors.goldLight, dark: coupColors.goldDark },
          background: { default: coupColors.charcoal, paper: coupColors.navy },
          text: { primary: coupColors.textPrimary, secondary: coupColors.textSecondary },
          info: { main: coupColors.teal },
          error: { main: coupColors.crimsonLight },
        },
        typography: {
          fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
          h1: { fontFamily: '"Cinzel Decorative", "Cinzel", serif', fontWeight: 700 },
          h2: { fontFamily: '"Cinzel Decorative", "Cinzel", serif', fontWeight: 700 },
          h3: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
          h4: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
          h5: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
          h6: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
          subtitle1: { fontFamily: '"Raleway", sans-serif', fontWeight: 600 },
          subtitle2: { fontFamily: '"Raleway", sans-serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
          body1: { fontFamily: '"Raleway", sans-serif', fontWeight: 400 },
          body2: { fontFamily: '"Raleway", sans-serif', fontWeight: 400 },
          button: { fontFamily: '"Raleway", sans-serif', fontWeight: 700, letterSpacing: '0.05em' },
          caption: { fontFamily: '"Raleway", sans-serif', fontWeight: 500 },
        },
        shape: { borderRadius: 8 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none' as const,
                borderRadius: 8,
              },
              containedPrimary: {
                background: `linear-gradient(135deg, ${coupColors.crimson} 0%, ${coupColors.crimsonLight} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${coupColors.crimsonLight} 0%, ${coupColors.crimson} 100%)`,
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: coupColors.gold },
                  '&.Mui-focused fieldset': { borderColor: coupColors.gold },
                },
                '& .MuiInputLabel-root': { color: coupColors.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: coupColors.gold },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: coupColors.gold },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: coupColors.gold },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                backgroundColor: coupColors.navy,
                border: `1px solid rgba(255,255,255,0.08)`,
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                backgroundColor: coupColors.surface,
                border: '1px solid rgba(255,255,255,0.08)',
              },
            },
          },
        },
      }),
    [],
  );

  const value = useMemo(() => ({ colors: coupColors, muiTheme }), [muiTheme]);

  return (
    <CoupThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CoupThemeContext.Provider>
  );
}

export { coupColors };
