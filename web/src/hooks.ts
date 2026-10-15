import { useCallback, useEffect, useRef, useState } from "react";
import { chainNow, describeError } from "./lib/chain.ts";
import type { Phase, TxOutcome } from "./lib/types.ts";

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/** Load once, then refresh every `everyMs` (0 = never). Keeps the last good data while a refresh is running or fails. */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[], everyMs = 0): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  useEffect(() => {
    let live = true;
    const run = () =>
      loaderRef
        .current()
        .then((d) => live && (setData(d), setError(null)))
        .catch((e) => live && setError(describeError(e)))
        .finally(() => live && setLoading(false));
    setLoading(true);
    void run();
    const id = everyMs > 0 ? setInterval(run, everyMs) : undefined;
    return () => {
      live = false;
      if (id) clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, everyMs]);
  return { data, error, loading, reload: useCallback(() => setTick((t) => t + 1), []) };
}

export type TxState =
  | { kind: "idle" }
  | { kind: "running"; phase: Phase; detail?: string }
  | { kind: "done"; outcome: TxOutcome }
  | { kind: "error"; message: string };

export function useTx() {
  const [state, setState] = useState<TxState>({ kind: "idle" });
  const run = useCallback(async (fn: (onPhase: (p: Phase, d?: string) => void) => Promise<TxOutcome>): Promise<TxOutcome | null> => {
    setState({ kind: "running", phase: "signing" });
    try {
      const outcome = await fn((phase, detail) => setState({ kind: "running", phase, detail }));
      setState({ kind: "done", outcome });
      return outcome;
    } catch (e) {
      setState({ kind: "error", message: describeError(e) });
      return null;
    }
  }, []);
  const reset = useCallback(() => setState({ kind: "idle" }), []);
  return { state, run, busy: state.kind === "running", reset };
}

/** The chain's own clock (the browser clock can be off by tens of seconds), ticking every second. */
export function useChainClock(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    let live = true;
    let offset = 0;
    const sync = () =>
      chainNow()
        .then((t) => live && (offset = t - Math.floor(Date.now() / 1000)))
        .catch(() => undefined);
    void sync();
    const id = setInterval(() => live && setNow(Math.floor(Date.now() / 1000) + offset), 1000);
    const resync = setInterval(sync, 300000); // one request every 5 minutes: the request budget is 500 an hour
    return () => {
      live = false;
      clearInterval(id);
      clearInterval(resync);
    };
  }, []);
  return now;
}
