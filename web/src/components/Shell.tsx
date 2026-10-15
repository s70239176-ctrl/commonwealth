import { useState, type ReactNode } from "react";
import { NETWORK } from "../lib/chain.ts";
import { shortAddr } from "../lib/format.ts";
import { useSession } from "../wallet-context.ts";
import { useWorld } from "../world-context.tsx";
import { Emblem, Icon, type IconName } from "./Icons.tsx";
import { StatusBadge } from "./kit.tsx";

export type RouteId = "world" | "play" | "agents" | "citizens" | "market" | "laws";

interface NavItem { id: RouteId; label: string; href: string; icon: IconName; mobile: boolean }

/** Only destinations that are backed by real data and behaviour. There is deliberately no Settings: nothing exists to configure. */
export const NAV: NavItem[] = [
  { id: "world", label: "World", href: "#/", icon: "world", mobile: true },
  { id: "play", label: "Play", href: "#/play", icon: "play", mobile: true },
  { id: "agents", label: "Agents", href: "#/agents", icon: "agents", mobile: true },
  { id: "citizens", label: "Citizens", href: "#/citizens", icon: "citizens", mobile: true },
  { id: "laws", label: "Laws", href: "#/laws", icon: "laws", mobile: false },
  { id: "market", label: "Market", href: "#/market", icon: "market", mobile: true },
];

function NetworkChip() {
  const { snapshot, error, loading } = useWorld();
  if (error && !snapshot) return <StatusBadge tone="bad" icon="alert">Network unreachable</StatusBadge>;
  if (loading && !snapshot) return <StatusBadge tone="muted" icon="clock">Connecting…</StatusBadge>;
  const w = snapshot?.world;
  if (!w) return <StatusBadge tone="muted">No data</StatusBadge>;
  return (
    <span className="net-chip">
      <StatusBadge tone={error ? "warn" : "ok"} icon={error ? "alert" : "check"}>{error ? "Stale data" : NETWORK}</StatusBadge>
      <span className="net-epoch">{w.status === "ENDED" ? "Season ended" : `Epoch ${Math.min(w.epoch, w.seasonEpochs)} of ${w.seasonEpochs}`}</span>
    </span>
  );
}

function Account() {
  const { signer, connectWallet, useDemoAccount, disconnect } = useSession();
  const [open, setOpen] = useState(false);
  if (signer) {
    return (
      <div className="account">
        <span className="account-id" title={signer.address}>
          <Icon name="wallet" size={15} />
          <span className="mono">{shortAddr(signer.address)}</span>
          <span className="account-kind">{signer.kind === "sandbox" ? "demo" : "wallet"}</span>
        </span>
        <button className="btn btn-quiet btn-sm" onClick={disconnect}>Disconnect</button>
      </div>
    );
  }
  return (
    <div className="account">
      <button className="btn btn-primary btn-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">Connect</button>
      {open ? (
        <div className="menu" role="menu">
          <button role="menuitem" className="menu-item" onClick={() => { setOpen(false); void connectWallet(); }}><Icon name="wallet" size={16} /> Browser wallet</button>
          <button role="menuitem" className="menu-item" onClick={() => { setOpen(false); useDemoAccount(); }}><Icon name="user" size={16} /> Demo account</button>
          <p className="menu-note">The demo account is a throwaway key kept in this browser, for test GEN only.</p>
        </div>
      ) : null}
    </div>
  );
}

export function Shell({ route, title, children }: { route: RouteId | null; title: string; children: ReactNode }) {
  const { signer } = useSession();
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <aside className="sidebar" aria-label="Primary">
        <a className="brand" href="#/" aria-label="Commonwealth, home">
          <Emblem size={34} />
          <span className="brand-text"><b>COMMONWEALTH</b><small>A living society on chain</small></span>
        </a>
        <nav>
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={n.href} className={`nav-link ${route === n.id ? "nav-on" : ""}`} aria-current={route === n.id ? "page" : undefined}>
                  <Icon name={n.icon} size={19} />
                  <span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-foot">
          {signer ? (
            <a className="who" href={`#/citizen/${signer.address}`}>
              <Icon name="user" size={16} />
              <span><small>{signer.kind === "sandbox" ? "Demo account" : "Connected wallet"}</small><span className="mono">{shortAddr(signer.address)}</span></span>
            </a>
          ) : (
            <p className="who who-empty"><Icon name="wallet" size={16} /><span><small>Not connected</small>Read-only</span></p>
          )}
        </div>
      </aside>

      <div className="stage">
        <header className="topbar">
          <a className="brand brand-mobile" href="#/" aria-label="Commonwealth, home"><Emblem size={28} /><b>COMMONWEALTH</b></a>
          <p className="crumbs" aria-label="You are here"><span>Commonwealth</span><span aria-hidden="true">/</span><strong>{title}</strong></p>
          <div className="topbar-right">
            <NetworkChip />
            <Account />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="content">{children}</main>
        <footer className="foot">
          <span>Runs on the {NETWORK} test network. This page shows what the contract says and decides nothing.</span>
          <a href="#/laws">Read the charter</a>
        </footer>
      </div>

      <nav className="bottomnav" aria-label="Primary mobile">
        {NAV.filter((n) => n.mobile).map((n) => (
          <a key={n.id} href={n.href} className={`bn-link ${route === n.id ? "bn-on" : ""}`} aria-current={route === n.id ? "page" : undefined}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
