import { useEffect, useState } from 'react';
import type { Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Hook: detect prefers-reduced-motion
// ---------------------------------------------------------------------------

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent): void => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ---------------------------------------------------------------------------
// Hook: return no-op variants when reduced motion is preferred
// ---------------------------------------------------------------------------

export function useMotionVariants<T extends Variants>(
  variants: T,
): T | Record<keyof T, { opacity: number }> {
  const reduced = useReducedMotion();

  if (!reduced) return variants;

  const noOp = {} as Record<keyof T, { opacity: number }>;
  for (const key of Object.keys(variants) as (keyof T)[]) {
    noOp[key] = { opacity: 1 };
  }
  return noOp;
}
