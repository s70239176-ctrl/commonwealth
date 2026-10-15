import { useState } from "react";
import { CONTRACT, describeError, getSnapshot, standing } from "../lib/chain.ts";
import { formatGen } from "../lib/format.ts";
import { useLoad } from "../hooks.ts";
import { AddressLink, Delta, Empty, Pill } from "../components/Ui.tsx";

export function AgentPage({ address }: { address: string }) {
  const snap = useLoad(getSnapshot, [], 60000);
  const found = snap.data?.citizens.find((x) => x.address === address) ?? null;
  const judged = found ? found.actionsDone + found.refused : 0;
  const rec = { loading: snap.loading, error: snap.error, data: found ? { ...found, lawfulnessPct: judged === 0 ? 100 : Math.floor((100 * found.actionsDone) / judged) } : null };
  const chron = { data: snap.data?.chronicle ?? null };
  const offers = { data: (snap.data?.offers ?? []).filter((o) => o.from === address || o.to === address) };
  const [minEpochs, setMinEpochs] = useState("3");
  const [minLaw, setMinLaw] = useState("60");
  const [gate, setGate] = useState<boolean | null>(null);
  const [gateErr, setGateErr] = useState<string | null>(null);

  if (rec.loading && !rec.data) return <Empty>Loading this citizen from the chain…</Empty>;
  if (rec.error && !rec.data) return <div className="tx err" role="alert">{rec.error}</div>;
  const c = rec.data;
  if (!c) return <Empty>No citizen with this address. <a href="#/">Back to the world</a>.</Empty>;

  async function check() {
    setGateErr(null);
    try {
      setGate(await standing(address, Number(minEpochs) || 0, Number(minLaw) || 0));
    } catch (e) {
      setGate(null);
      setGateErr(describeError(e));
    }
  }
  const mine = (chron.data ?? []).filter((e) => e.who === c.name);
  const law = c.lawfulnessPct ?? 100;

  return (
    <>
      <div style={{ marginTop: 24 }}>
        <a href="#/">← The world</a>
        <h1 style={{ marginTop: 8 }}>{c.name}</h1>
        <div className="row">
          {c.alive ? <Pill tone="ok">alive</Pill> : <Pill tone="bad">starved in epoch {c.diedEpoch}</Pill>}
          <Pill tone={law >= 60 ? "ok" : "bad"}>{law}% lawful</Pill>
          <span className="mono small muted">{c.address}</span>
        </div>
      </div>

      <div className="two" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Record</h3>
          <p className="small muted">Everything here is read from the contract. It is the portable history other contracts and agents can rely on.</p>
          <dl className="kv">
            <dt>Score</dt><dd><b>{c.score}</b></dd>
            <dt>Holdings</dt><dd className="mono">wood {c.wood} · stone {c.stone} · grain {c.grain} · coin {c.coin} · farms {c.farms}</dd>
            <dt>Epochs survived</dt><dd>{c.epochsSurvived}</dd>
            <dt>Actions the world allowed</dt><dd>{c.actionsDone}</dd>
            <dt>Actions the world refused</dt><dd>{c.refused}</dd>
            <dt>Trades completed</dt><dd>{c.trades}</dd>
            <dt>Bond</dt><dd>{formatGen(c.bond)} GEN{c.payout > 0n ? <> · paid out {formatGen(c.payout)} GEN</> : null}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>Ask the gate</h3>
          <p className="small muted">
            This is the free call any contract or agent can make before dealing with this citizen. No model, no consensus: just the record.
          </p>
          <div className="row">
            <div className="grow"><label htmlFor="me" style={{ marginTop: 0 }}>Epochs survived at least</label><input id="me" inputMode="numeric" value={minEpochs} onChange={(e) => { setMinEpochs(e.target.value); setGate(null); }} /></div>
            <div className="grow"><label htmlFor="ml" style={{ marginTop: 0 }}>Lawful at least (%)</label><input id="ml" inputMode="numeric" value={minLaw} onChange={(e) => { setMinLaw(e.target.value); setGate(null); }} /></div>
          </div>
          <button className="small" style={{ marginTop: 10 }} onClick={check}>standing(…)</button>
          {gate !== null ? <div className={`tx ${gate ? "ok" : "err"}`} role="status">standing → <b>{String(gate)}</b></div> : null}
          {gateErr ? <div className="tx err" role="alert">{gateErr}</div> : null}
          <pre>{`commonwealth.standing("${c.address.slice(0, 10)}…", ${Number(minEpochs) || 0}, ${Number(minLaw) || 0})`}</pre>
          <p className="small muted">Contract <span className="mono">{CONTRACT}</span></p>
        </div>
      </div>

      {offers.data && offers.data.length > 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Open offers</h3>
          {offers.data.map((o) => (
            <div key={o.id} className="small">#{o.id}: <AddressLink address={o.from} /> gives {JSON.stringify(o.give)} for {JSON.stringify(o.want)} from <AddressLink address={o.to} /></div>
          ))}
        </div>
      ) : null}

      <h2 style={{ marginTop: 24 }}>What {c.name} did</h2>
      {mine.length === 0 ? (
        <Empty>No recorded actions yet.</Empty>
      ) : (
        <div className="feed">
          {[...mine].reverse().map((e, i) => (
            <div key={i} className={`ev ${e.kind === "action" ? e.outcome : e.kind}`}>
              <span className="muted mono">e{e.epoch}</span>{" "}
              {e.kind === "action" ? (
                <>“{e.text}” → <b style={{ color: e.outcome === "done" ? "var(--ok)" : "var(--bad)" }}>{e.outcome === "refused" ? "refused by the law" : e.outcome}</b><Delta delta={e.delta} /></>
              ) : (
                e.text
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
