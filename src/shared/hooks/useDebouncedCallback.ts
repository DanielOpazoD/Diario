import { useCallback, useEffect, useRef } from 'react';

export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delayMs: number
) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );

  useEffect(() => () => cancel(), [cancel]);

  return { debounced, cancel };
};
