import { useCallback, useEffect, useMemo, useState } from "react";
import { Ctx, type Session } from "./wallet-context.ts";
import { connectWallet, createSandbox, forgetSandbox, getProvider, loadSandbox, type Signer } from "./lib/signer.ts";
import { describeError, hasContract } from "./lib/chain.ts";
import { WorldProvider } from "./world-context.tsx";
import { Shell, type RouteId } from "./components/Shell.tsx";
import { EmptyState } from "./components/kit.tsx";
import { WorldPage } from "./screens/WorldPage.tsx";
import { PlayPage } from "./screens/PlayPage.tsx";
import { AgentsPage } from "./screens/AgentsPage.tsx";
import { CitizensPage } from "./screens/CitizensPage.tsx";
import { CitizenPage } from "./screens/CitizenPage.tsx";
import { MarketPage } from "./screens/MarketPage.tsx";
import { LawsPage } from "./screens/LawsPage.tsx";

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash || "#/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

/**
 * Routes (hash-based, so deep links work on any static host):
 *   #/   #/play   #/agents   #/citizens   #/citizen/:address   #/market   #/laws
 * The original #/agent/:address deep link still resolves to the citizen profile.
 */
export function App() {
  const hash = useHashRoute();
  const [signer, setSigner] = useState<Signer | null>(() => loadSandbox());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProvider()?.on?.("accountsChanged", (a) => {
      setSigner((cur) => (cur?.kind === "wallet" ? (a[0] ? { kind: "wallet", address: a[0].toLowerCase() } : null) : cur));
    });
  }, []);
  const doConnect = useCallback(async () => {
    try {
      setError(null);
      setSigner(await connectWallet());
    } catch (e) {
      setError(describeError(e));
    }
  }, []);
  const useDemoAccount = useCallback(() => {
    setError(null);
    setSigner(loadSandbox() ?? createSandbox());
  }, []);
  const disconnect = useCallback(() => {
    if (signer?.kind === "sandbox") forgetSandbox();
    setSigner(null);
  }, [signer]);
  const session: Session = useMemo(
    () => ({ signer, me: signer?.address ?? "", connectWallet: doConnect, useDemoAccount, disconnect, requireSigner: () => signer, error }),
    [signer, doConnect, useDemoAccount, disconnect, error],
  );

  const parts = hash.replace(/^#\/?/, "").split("/");
  let route: RouteId | null = "world";
  let title = "World";
  let page = <WorldPage />;
  if (parts[0] === "play") { route = "play"; title = "Play"; page = <PlayPage />; }
  else if (parts[0] === "agents") { route = "agents"; title = "Agents"; page = <AgentsPage />; }
  else if (parts[0] === "citizens") { route = "citizens"; title = "Citizens"; page = <CitizensPage />; }
  else if ((parts[0] === "citizen" || parts[0] === "agent") && parts[1]) { route = "citizens"; title = "Citizen"; page = <CitizenPage address={parts[1].toLowerCase()} />; }
  else if (parts[0] === "market") { route = "market"; title = "Market"; page = <MarketPage />; }
  else if (parts[0] === "laws") { route = "laws"; title = "Laws"; page = <LawsPage />; }
  else if (parts[0] !== "") { route = null; title = "Not found"; page = <div className="page"><EmptyState icon="alert" title="That page does not exist">Go back to the <a href="#/">World</a>.</EmptyState></div>; }

  return (
    <Ctx.Provider value={session}>
      <WorldProvider>
        <Shell route={route} title={title}>
          {error ? <div className="notice notice-bad page-notice" role="alert">{error}</div> : null}
          {!hasContract ? <div className="notice notice-bad page-notice" role="alert">No contract is configured. Set <span className="mono">VITE_CONTRACT_ADDRESS</span>.</div> : null}
          {signer?.kind === "sandbox" ? <div className="notice notice-warn page-notice"><b>Demo account.</b> A throwaway key stored in this browser, for test-network GEN only. Never send real funds to it.</div> : null}
          {page}
        </Shell>
      </WorldProvider>
    </Ctx.Provider>
  );
}
