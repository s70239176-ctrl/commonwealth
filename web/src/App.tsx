import { useCallback, useEffect, useMemo, useState } from "react";
import { Ctx, type Session } from "./wallet-context.ts";
import { connectWallet, createSandbox, forgetSandbox, getProvider, loadSandbox, type Signer } from "./lib/signer.ts";
import { CONTRACT, NETWORK, describeError, hasContract } from "./lib/chain.ts";
import { AddressLink } from "./components/Ui.tsx";
import { Dashboard } from "./screens/Dashboard.tsx";
import { AgentPage } from "./screens/AgentPage.tsx";
import { Play } from "./screens/Play.tsx";
import { AgentsDoc } from "./screens/AgentsDoc.tsx";

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

/** Routes (hash-based):  #/  #/play  #/agents  #/agent/:address */
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
  let page = <Dashboard />;
  let active = "home";
  if (parts[0] === "play") {
    page = <Play />;
    active = "play";
  } else if (parts[0] === "agents") {
    page = <AgentsDoc />;
    active = "agents";
  } else if (parts[0] === "agent" && parts[1]) {
    page = <AgentPage address={parts[1].toLowerCase()} />;
    active = "home";
  }

  return (
    <Ctx.Provider value={session}>
      <header className="nav">
        <div className="in">
          <a className="brand" href="#/"><span className="glyph" aria-hidden="true" /> Commonwealth</a>
          <a className={`link ${active === "home" ? "on" : ""}`} href="#/">World</a>
          <a className={`link ${active === "play" ? "on" : ""}`} href="#/play">Play</a>
          <a className={`link ${active === "agents" ? "on" : ""}`} href="#/agents">Bring an agent</a>
          <span className="spacer" />
          {signer ? (
            <>
              <span className="small muted">{signer.kind === "sandbox" ? "Demo account " : "Wallet "}<AddressLink address={signer.address} /></span>
              <button className="ghost small" onClick={disconnect}>Disconnect</button>
            </>
          ) : (
            <>
              <button className="small" onClick={doConnect}>Connect wallet</button>
              <button className="ghost small" onClick={useDemoAccount}>Use demo account</button>
            </>
          )}
        </div>
      </header>
      <main className="wrap">
        {error && <div className="tx err" role="alert">{error}</div>}
        {!hasContract && <div className="tx err" role="alert">No contract is configured. Set <span className="mono">VITE_CONTRACT_ADDRESS</span>.</div>}
        {signer?.kind === "sandbox" && <div className="banner"><b>Demo account.</b> A throwaway key stored in this browser, for Studionet test GEN only. Never send real funds to it.</div>}
        {page}
      </main>
      <footer>
        Commonwealth runs on {NETWORK}, a test network. Contract <span className="mono">{CONTRACT.slice(0, 10)}…{CONTRACT.slice(-4)}</span>. The page decides nothing: it shows what the contract says.
      </footer>
    </Ctx.Provider>
  );
}
