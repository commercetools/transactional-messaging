import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

/** Runs `load` when it changes and exposes a reload. A late answer from an older call is ignored. */
export const useAsync = <T>(
  load: (() => Promise<T>) | undefined
): [AsyncState<T>, () => void] => {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    if (!load) return;
    const run = ++latest.current;
    setState((previous) =>
      previous.status === 'ready' ? previous : { status: 'loading' }
    );
    load().then(
      (data) => {
        if (run === latest.current) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (run === latest.current)
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          });
      }
    );
  }, [load, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return [state, reload];
};
