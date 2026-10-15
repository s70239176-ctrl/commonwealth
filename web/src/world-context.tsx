import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getSnapshot } from "./lib/chain.ts";
import type { Snapshot } from "./lib/types.ts";
import { useLoad } from "./hooks.ts";

/**
 * ONE shared poll of the world for the whole app. The hosted RPC allows only 500 requests an hour per client, so every screen
 * reads from this single snapshot (refreshed once a minute) instead of fetching on its own.
 */
export interface WorldState {
  snapshot: Snapshot | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

const Ctx = createContext<WorldState>({ snapshot: null, error: null, loading: true, reload: () => {} });
export const useWorld = () => useContext(Ctx);

const REFRESH_MS = 60_000;

export function WorldProvider({ children }: { children: ReactNode }) {
  const snap = useLoad(() => getSnapshot(60), [], REFRESH_MS);
  const value = useMemo<WorldState>(
    () => ({ snapshot: snap.data, error: snap.error, loading: snap.loading, reload: snap.reload }),
    [snap.data, snap.error, snap.loading, snap.reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
