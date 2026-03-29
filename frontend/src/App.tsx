import { type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CoupThemeProvider } from './theme/ThemeProvider';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';
import Rules from './pages/Rules';

interface RouteConfig {
  path: string;
  element: ReactElement;
}

const routes: RouteConfig[] = [
  { path: '/', element: <Home /> },
  { path: '/room/:code', element: <GameRoom /> },
  { path: '/rules', element: <Rules /> },
];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {routes.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ minHeight: '100vh' }}
              >
                {r.element}
              </motion.div>
            }
          />
        ))}
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CoupThemeProvider>
      <ErrorBoundary>
        <SocketProvider>
          <GameProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </GameProvider>
        </SocketProvider>
      </ErrorBoundary>
    </CoupThemeProvider>
  );
}
