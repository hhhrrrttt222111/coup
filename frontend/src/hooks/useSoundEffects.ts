import { useCallback, useRef, useEffect } from 'react';

const AudioCtx = typeof window !== 'undefined'
  ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
  : null;

function createOscillatorSound(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  detune = 0,
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playChord(ctx: AudioContext, frequencies: number[], duration: number, type: OscillatorType = 'sine', gain = 0.08) {
  frequencies.forEach((f, i) => {
    createOscillatorSound(ctx, f, duration, type, gain, i * 2);
  });
}

export type SoundEffect =
  | 'hover'
  | 'click'
  | 'navigate'
  | 'success'
  | 'error'
  | 'dramatic'
  | 'coin'
  | 'card_flip'
  | 'challenge'
  | 'eliminate'
  | 'victory'
  | 'ambient_start';

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!AudioCtx) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  const play = useCallback(
    (effect: SoundEffect) => {
      const ctx = getCtx();
      if (!ctx) return;

      switch (effect) {
        case 'hover':
          createOscillatorSound(ctx, 800, 0.06, 'sine', 0.04);
          break;

        case 'click':
          createOscillatorSound(ctx, 600, 0.1, 'triangle', 0.1);
          createOscillatorSound(ctx, 900, 0.08, 'sine', 0.06);
          break;

        case 'navigate':
          createOscillatorSound(ctx, 400, 0.15, 'sine', 0.1);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 600, 0.15, 'sine', 0.1);
          }, 80);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 800, 0.2, 'sine', 0.08);
          }, 160);
          break;

        case 'success':
          playChord(ctx, [523.25, 659.25, 783.99], 0.4, 'sine', 0.08);
          setTimeout(() => {
            if (ctx.state !== 'closed') playChord(ctx, [587.33, 739.99, 880], 0.5, 'sine', 0.06);
          }, 200);
          break;

        case 'error':
          createOscillatorSound(ctx, 200, 0.3, 'sawtooth', 0.08);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 150, 0.4, 'sawtooth', 0.06);
          }, 150);
          break;

        case 'dramatic': {
          playChord(ctx, [130.81, 155.56, 196], 1.2, 'sawtooth', 0.04);
          const noise = ctx.createBufferSource();
          const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
          noise.buffer = buffer;
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.03, ctx.currentTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          noise.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          noise.start();
          break;
        }

        case 'coin':
          createOscillatorSound(ctx, 2000, 0.08, 'sine', 0.1);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 2500, 0.06, 'sine', 0.08);
          }, 60);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 3000, 0.1, 'sine', 0.05);
          }, 120);
          break;

        case 'card_flip':
          createOscillatorSound(ctx, 300, 0.1, 'triangle', 0.08);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 500, 0.08, 'triangle', 0.06);
          }, 50);
          break;

        case 'challenge':
          createOscillatorSound(ctx, 220, 0.2, 'sawtooth', 0.08);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 330, 0.2, 'sawtooth', 0.08);
          }, 100);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 440, 0.3, 'sawtooth', 0.06);
          }, 200);
          break;

        case 'eliminate':
          createOscillatorSound(ctx, 300, 0.5, 'sawtooth', 0.1);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 200, 0.5, 'sawtooth', 0.08);
          }, 200);
          setTimeout(() => {
            if (ctx.state !== 'closed') createOscillatorSound(ctx, 100, 0.8, 'sawtooth', 0.06);
          }, 400);
          break;

        case 'victory':
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            setTimeout(() => {
              if (ctx.state !== 'closed') createOscillatorSound(ctx, f, 0.4, 'sine', 0.1);
            }, i * 150);
          });
          setTimeout(() => {
            if (ctx.state !== 'closed') playChord(ctx, [523.25, 659.25, 783.99, 1046.5], 1, 'sine', 0.06);
          }, 600);
          break;

        case 'ambient_start':
          playChord(ctx, [65.41, 82.41, 98], 2, 'sine', 0.03);
          break;
      }
    },
    [getCtx],
  );

  return { play };
}
