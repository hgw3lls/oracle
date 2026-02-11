import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePlaybackOptions {
  length: number;
  initialIndex?: number;
  initialFps?: number;
  initialLoop?: boolean;
}

export interface PlaybackController {
  index: number;
  fps: number;
  isPlaying: boolean;
  loop: boolean;
  play: () => void;
  stop: () => void;
  togglePlay: () => void;
  setFps: (next: number) => void;
  setLoop: (next: boolean) => void;
  setIndex: (next: number) => void;
  scrub: (delta: number) => void;
}

const clampIndex = (value: number, length: number) => {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, value));
};

export const usePlayback = ({
  length,
  initialIndex = 0,
  initialFps = 12,
  initialLoop = true,
}: UsePlaybackOptions): PlaybackController => {
  const [index, setIndexState] = useState(() => clampIndex(initialIndex, length));
  const [fps, setFpsState] = useState(Math.max(1, initialFps));
  const [loop, setLoop] = useState(initialLoop);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  const stop = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const setIndex = useCallback((next: number) => {
    setIndexState(clampIndex(next, length));
  }, [length]);

  const scrub = useCallback((delta: number) => {
    setIndexState((prev) => clampIndex(prev + delta, length));
  }, [length]);

  const play = useCallback(() => {
    if (length <= 1) return;
    setIsPlaying(true);
  }, [length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const setFps = useCallback((next: number) => {
    setFpsState(Math.max(1, Math.min(120, Number(next) || 1)));
  }, []);

  useEffect(() => {
    setIndexState((prev) => clampIndex(prev, length));
    if (length <= 1) setIsPlaying(false);
  }, [length]);

  useEffect(() => {
    if (!isPlaying || length <= 1) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      accumulatorRef.current = 0;
      return;
    }

    const frameDuration = 1000 / fps;

    const tick = (time: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }

      const dt = time - (lastTimeRef.current || time);
      lastTimeRef.current = time;
      accumulatorRef.current += dt;

      while (accumulatorRef.current >= frameDuration) {
        accumulatorRef.current -= frameDuration;
        let reachedEnd = false;
        setIndexState((prev) => {
          const next = prev + 1;
          if (next < length) return next;
          reachedEnd = true;
          return loop ? 0 : prev;
        });

        if (reachedEnd && !loop) {
          setIsPlaying(false);
          break;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      accumulatorRef.current = 0;
    };
  }, [fps, isPlaying, length, loop]);

  return {
    index,
    fps,
    isPlaying,
    loop,
    play,
    stop,
    togglePlay,
    setFps,
    setLoop,
    setIndex,
    scrub,
  };
};
