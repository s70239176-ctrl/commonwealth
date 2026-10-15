import { useState } from "react";
import { getOffers, getRecord, getWorld, sendTx } from "../lib/chain.ts";
import { formatGen } from "../lib/format.ts";
import type { Resource } from "../lib/types.ts";
import { RESOURCES } from "../lib/types.ts";
import { useLoad, useTx } from "../hooks.ts";
import { useSession } from "../wallet-context.ts";
import { AddressLink, Empty, NeedSigner, TxStatus } from "../components/Ui.tsx";

export function Play() {
  const { signer, me, connectWallet, useDemoAccount } = useSession();
  const world = useLoad(getWorld, [], 20000);
  const rec = useLoad(() => (me ? getRecord(me) : Promise.resolve(null)), [me], 20000);
  const offers = useLoad(() => (me ? getOffers(me) : Promise.resolve([])), [me], 20000);
  const join = useTx();
  const act = useTx();
  const farm = useTx();
  const trade = useTx();
  const [hash, setHash] = useState<string>();
  const [name, setName] = useState("");
  const [actions, setActions] = useState("Gather 5 grain in the meadow.\nGather 4 wood at the forest edge.");
  const [to, setTo] = useState("");
  const [give, setGive] = useState<Partial<Record<Resource, string>>>({ wood: "3" });
  const [want, setWant] = useState<Partial<Record<Resource, string>>>({ grain: "2" });
  const [err, setErr] = useState<string | null>(null);

  const w = world.data;
  const c = rec.data;
  const refresh = () => {
    world.reload();
    rec.reload();
    offers.reload();
  };

  async function doJoin() {
    if (!signer || !w) return setErr("Connect a wallet, or use the demo account, first.");
    if (!name.trim()) return setErr("Choose a name.");
    setErr(null);
    const out = await join.run((p) => sendTx(signer, "register", [name.trim()], w.bond, p, setHash));
    if (out && !out.error) refresh();
  }
  async function doAct() {
    if (!signer) return;
    const list = actions.split("\n").map((l) => l.trim()).filter(Boolean);
    if (list.length < 1 || list.length > 6) return setErr("Write between 1 and 6 actions, one per line.");
    setErr(null);
    const out = await act.run((p) => sendTx(signer, "act", [list], 0n, p, setHash));
    if (out && !out.error) refresh();
  }
  async function doFarm() {
    if (!signer) return;
    const out = await farm.run((p) => sendTx(signer, "build_farm", [], 0n, p, setHash));
    if (out && !out.error) refresh();
  }
  const bundle = (b: Partial<Record<Resource, string>>) =>
    JSON.stringify(Object.fromEntries(Object.entries(b).filter(([, v]) => v && Number(v) > 0).map(([k, v]) => [k, Math.trunc(Number(v))])));
  async function doOffer() {
    if (!signer) return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(to.trim())) return setErr("Paste the other citizen's address.");
    setErr(null);
    const out = await trade.run((p) => sendTx(signer, "offer", [to.trim().toLowerCase(), bundle(give), bundle(want)], 0n, p, setHash));
    if (out && !out.error) refresh();
  }
  async function doAccept(id: number) {
    if (!signer) return;
    const out = await trade.run((p) => sendTx(signer, "accept", [BigInt(id)], 0n, p, setHash));
    if (out && !out.error) refresh();
  }

  if (!w) return <Empty>Loading the world from the chain…</Empty>;
  const closed = w.status !== "RUNNING";

  return (
    <>
      <section className="hero">
        <h1>Play</h1>
        <p className="lead">Join with a bond, then each epoch describe what you do. You can do this yourself here, or point an agent at the contract (see <a href="#/agents">Bring an agent</a>).</p>
      </section>
      {err ? <div className="tx err" role="alert">{err}</div> : null}
      {closed ? <div className="banner">The season is over, so nothing more can be done in this world.</div> : null}

      {!signer ? <div className="card"><h3>Sign in</h3><NeedSigner connect={connectWallet} demo={useDemoAccount} /></div> : null}

      {signer && !c && !closed ? (
        <div className="card">
          <h3>Join the commonwealth</h3>
          <p className="small muted">
            Posting the bond of <b>{formatGen(w.bond)} GEN</b> makes you a citizen. If you starve you forfeit it; at season end survivors share the pool by score.
          </p>
          <label htmlFor="nm">Your name</label>
          <input id="nm" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <div style={{ marginTop: 12 }}><button disabled={join.busy} onClick={doJoin}>Post the bond and join</button></div>
          <TxStatus state={join.state} hash={hash} doneText={() => "You are a citizen."} />
        </div>
      ) : null}

      {signer && c ? (
        <div className="two">
          <div>
            <div className="card">
              <h3>{c.name}: {c.alive ? "alive" : "starved"}</h3>
              <p className="small mono">wood {c.wood} · stone {c.stone} · grain {c.grain} · coin {c.coin} · farms {c.farms} · score {c.score}</p>
              <p className="small muted">The world takes 2 grain from every citizen at the end of each epoch. Two hungry epochs in a row mean starvation.</p>
            </div>
            <div className="card" style={{ marginTop: 14 }}>
              <h3>Act (once per epoch)</h3>
              <p className="small muted">One action per line, up to 6. Anything the charter does not clearly permit is refused, and so is anything that depends on another citizen.</p>
              <textarea aria-label="Actions" value={actions} onChange={(e) => setActions(e.target.value)} />
              <div style={{ marginTop: 10 }}><button disabled={act.busy || closed || !c.alive} onClick={doAct}>Submit to the jury</button></div>
              <TxStatus state={act.state} hash={hash} doneText={(r) => `Judged${r ? `: ${r}` : ""}. See the chronicle.`} />
            </div>
          </div>
          <div>
            <div className="card">
              <h3>Build a farm</h3>
              <p className="small muted">Priced by the world's code: 5 wood and 3 stone (max 2). The charter says what a farm does to your grain gathers.</p>
              <button className="ghost" disabled={farm.busy || closed || !c.alive} onClick={doFarm}>Build a farm</button>
              <TxStatus state={farm.state} hash={hash} doneText={() => "Farm built."} />
            </div>
            <div className="card" style={{ marginTop: 14 }}>
              <h3>Trade</h3>
              <p className="small muted">Trades are plain code: no model decides who gets what. Offer something to another citizen, or accept an offer made to you.</p>
              <label htmlFor="to" style={{ marginTop: 0 }}>Their address</label>
              <input id="to" className="mono" placeholder="0x…" value={to} onChange={(e) => setTo(e.target.value)} />
              <div className="row">
                <div className="grow">
                  <label>You give</label>
                  {RESOURCES.map((r) => <div key={r} className="row"><span style={{ width: 52 }} className="small">{r}</span><input aria-label={`give ${r}`} inputMode="numeric" value={give[r] ?? ""} onChange={(e) => setGive({ ...give, [r]: e.target.value })} /></div>)}
                </div>
                <div className="grow">
                  <label>You want</label>
                  {RESOURCES.map((r) => <div key={r} className="row"><span style={{ width: 52 }} className="small">{r}</span><input aria-label={`want ${r}`} inputMode="numeric" value={want[r] ?? ""} onChange={(e) => setWant({ ...want, [r]: e.target.value })} /></div>)}
                </div>
              </div>
              <div style={{ marginTop: 10 }}><button disabled={trade.busy || closed || !c.alive} onClick={doOffer}>Make the offer</button></div>
              {offers.data && offers.data.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <h3>Open offers</h3>
                  {offers.data.map((o) => (
                    <div key={o.id} className="small" style={{ marginBottom: 6 }}>
                      #{o.id} <AddressLink address={o.from} /> → <AddressLink address={o.to} />: {JSON.stringify(o.give)} for {JSON.stringify(o.want)}{" "}
                      {o.to === me ? <button className="small" disabled={trade.busy} onClick={() => doAccept(o.id)}>Accept</button> : <span className="muted">waiting</span>}
                    </div>
                  ))}
                </div>
              ) : null}
              <TxStatus state={trade.state} hash={hash} doneText={(r) => (r ? `Done: ${r}.` : "Done.")} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
