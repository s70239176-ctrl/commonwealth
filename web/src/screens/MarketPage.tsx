import { useState } from "react";
import { sendTx } from "../lib/chain.ts";
import { RULES } from "../lib/rules.ts";
import type { Offer, Resource } from "../lib/types.ts";
import { RESOURCES } from "../lib/types.ts";
import { useTx } from "../hooks.ts";
import { useSession } from "../wallet-context.ts";
import { useWorld } from "../world-context.tsx";
import { Icon } from "../components/Icons.tsx";
import { EmptyState, ErrorState, SectionHeader, Skeleton, TxStatus, resourceLabel } from "../components/kit.tsx";

type Bundle = Partial<Record<Resource, string>>;

const describe = (b: Partial<Record<Resource, number>>): string =>
  RESOURCES.filter((r) => b[r]).map((r) => `${b[r]} ${r}`).join(" + ") || "nothing";

export function MarketPage() {
  const { signer, me, connectWallet, useDemoAccount } = useSession();
  const { snapshot, error, loading, reload } = useWorld();
  const trade = useTx();
  const [hash, setHash] = useState<string>();
  const [to, setTo] = useState("");
  const [give, setGive] = useState<Bundle>({ wood: "3" });
  const [want, setWant] = useState<Bundle>({ grain: "2" });
  const [problem, setProblem] = useState<string | null>(null);

  const w = snapshot?.world ?? null;
  const citizens = snapshot?.citizens ?? [];
  const byAddress = (a: string) => citizens.find((c) => c.address === a)?.name ?? `${a.slice(0, 8)}…`;
  const mine = citizens.find((c) => c.address === me) ?? null;
  const others = citizens.filter((c) => c.alive && c.address !== me);
  const offers = snapshot?.offers ?? [];
  const running = !!w && w.status === "RUNNING";

  const bundle = (b: Bundle): Partial<Record<Resource, number>> =>
    Object.fromEntries(Object.entries(b).filter(([, v]) => v && Number(v) > 0).map(([k, v]) => [k, Math.trunc(Number(v))]));

  async function make() {
    setProblem(null);
    if (!signer || !mine) return setProblem("Sign in and join the commonwealth first.");
    if (!to) return setProblem("Choose who the offer is for.");
    const g = bundle(give);
    const x = bundle(want);
    if (Object.keys(g).length === 0 || Object.keys(x).length === 0) return setProblem("Both sides need at least one resource with a whole number of 1 or more.");
    const out = await trade.run((p) => sendTx(signer, "offer", [to, JSON.stringify(g), JSON.stringify(x)], 0n, p, setHash));
    if (out && !out.error) reload();
  }
  async function accept(o: Offer) {
    if (!signer) return;
    const out = await trade.run((p) => sendTx(signer, "accept", [BigInt(o.id)], 0n, p, setHash));
    if (out && !out.error) reload();
  }
  async function cancel(o: Offer) {
    if (!signer) return;
    const out = await trade.run((p) => sendTx(signer, "cancel_offer", [BigInt(o.id)], 0n, p, setHash));
    if (out && !out.error) reload();
  }

  return (
    <div className="page">
      <SectionHeader as="h1" title="Market" eyebrow="Trades between citizens">
        <span className="help">Trades are plain code: no model decides who gets what.</span>
      </SectionHeader>
      {error && !snapshot ? <ErrorState message={error} onRetry={reload} /> : loading && !snapshot ? <div className="panel panel-paper"><Skeleton lines={5} /></div> : null}

      {w ? (
        <div className="cols">
          <section className="panel panel-paper" aria-labelledby="offers-title">
            <SectionHeader as="h2" title="Open offers" eyebrow="Confirmed on chain" />
            <p id="offers-title" className="panel-note">Offers are not held in escrow. They can only be accepted while both sides still hold what is promised.</p>
            {offers.length === 0 ? (
              <EmptyState icon="market" title="No open offers">Offers made to another citizen appear here until they are accepted or cancelled.</EmptyState>
            ) : (
              <ul className="offers">
                {offers.map((o) => (
                  <li key={o.id} className="offer">
                    <div className="offer-main">
                      <span className="mono">#{o.id}</span>
                      <span><a href={`#/citizen/${o.from}`}>{byAddress(o.from)}</a> gives <b>{describe(o.give)}</b></span>
                      <Icon name="trade" size={16} />
                      <span><a href={`#/citizen/${o.to}`}>{byAddress(o.to)}</a> gives <b>{describe(o.want)}</b></span>
                      <span className="help">epoch {o.epoch}</span>
                    </div>
                    <div className="offer-actions">
                      {o.to === me && running ? <button className="btn btn-primary btn-sm" disabled={trade.busy} onClick={() => accept(o)}>Accept</button> : null}
                      {o.from === me && running ? <button className="btn btn-quiet btn-sm" disabled={trade.busy} onClick={() => cancel(o)}>Cancel</button> : null}
                      {o.to !== me && o.from !== me ? <span className="help">between other citizens</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <TxStatus state={trade.state} hash={hash} doneText={(r) => (r ? `Done: ${r}.` : "Done.")} />
          </section>

          <section className="panel panel-dark" aria-labelledby="make-title">
            <SectionHeader as="h2" title="Make an offer" eyebrow="You propose, they decide" />
            {!signer ? (
              <>
                <p id="make-title">Sign in to make or accept offers.</p>
                <div className="row"><button className="btn btn-primary" onClick={() => void connectWallet()}>Connect wallet</button><button className="btn btn-ghost" onClick={useDemoAccount}>Use demo account</button></div>
              </>
            ) : !mine ? (
              <p id="make-title">You are not a citizen yet. <a href="#/play">Join from the Play page</a> to trade.</p>
            ) : !running ? (
              <p id="make-title">The season is over, so trading is closed.</p>
            ) : (
              <>
                <p id="make-title" className="help-light">You can have at most {RULES.maxOpenOffers} open offers. You must hold what you give.</p>
                <label className="field" htmlFor="offer-to"><span>Offer to</span></label>
                <select id="offer-to" className="input" value={to} onChange={(e) => setTo(e.target.value)}>
                  <option value="">Choose a citizen…</option>
                  {others.map((c) => <option key={c.address} value={c.address}>{c.name}</option>)}
                </select>
                <div className="bundle-grid">
                  <fieldset><legend>You give</legend>{RESOURCES.map((r) => <label key={r} className="bundle-row"><span>{resourceLabel(r)}</span><input className="input" inputMode="numeric" aria-label={`give ${r}`} value={give[r] ?? ""} onChange={(e) => setGive({ ...give, [r]: e.target.value })} /></label>)}</fieldset>
                  <fieldset><legend>You want</legend>{RESOURCES.map((r) => <label key={r} className="bundle-row"><span>{resourceLabel(r)}</span><input className="input" inputMode="numeric" aria-label={`want ${r}`} value={want[r] ?? ""} onChange={(e) => setWant({ ...want, [r]: e.target.value })} /></label>)}</fieldset>
                </div>
                <p className="field-error" role="alert">{problem ?? ""}</p>
                <button className="btn btn-primary" disabled={trade.busy} onClick={make}>{trade.busy ? "Sending…" : "Send the offer"}</button>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
