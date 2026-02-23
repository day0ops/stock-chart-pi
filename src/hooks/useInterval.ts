import { useEffect, useRef } from 'react';

// Custom hook for configurable intervals
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}

// Hook that runs callback immediately and then on interval
export function useIntervalImmediate(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const hasRun = useRef(false);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Run immediately on mount
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      savedCallback.current();
    }
  }, []);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}
