import { useState } from "react";
import { getSnapshot, sendTx } from "../lib/chain.ts";
import { formatGen } from "../lib/format.ts";
import type { ChronicleEntry, Citizen, World } from "../lib/types.ts";
import { useChainClock, useLoad, useTx } from "../hooks.ts";
import { useSession } from "../wallet-context.ts";
import { AddressLink, Delta, Empty, Pill, TxStatus, countdown } from "../components/Ui.tsx";

const REFRESH = 60000; // one snapshot read a minute: the RPC allows 500 requests an hour per client

function lawfulness(c: Citizen): number {
  const judged = c.actionsDone + c.refused;
  return judged === 0 ? 100 : Math.floor((100 * c.actionsDone) / judged);
}

function WorldBar({ w, now, reload }: { w: World; now: number; reload: () => void }) {
  const { requireSigner } = useSession();
  const tx = useTx();
  const [hash, setHash] = useState<string>();
  const left = w.nextEpochAt - now;
  const signer = requireSigner();
  const progress = Math.min(100, Math.round(((w.epoch - 1) / w.seasonEpochs) * 100));
  async function go(fn: "end_epoch" | "settle_season") {
    if (!signer) return;
    const out = await tx.run((p) => sendTx(signer, fn, [], 0n, p, setHash, fn === "settle_season" ? "finalized" : "accepted"));
    if (out && !out.error) reload();
  }
  return (
    <>
      <div className="sky">
        <Pill tone="amber">{w.conditions.season}</Pill>
        <Pill tone={w.conditions.event === "calm weather" || w.conditions.event === "bountiful harvest" ? "ok" : "warn"}>{w.conditions.event}</Pill>
        <Pill tone={w.status === "RUNNING" ? "ok" : undefined}>{w.status === "RUNNING" ? "season running" : w.settled ? "season paid out" : "season ended"}</Pill>
      </div>
      <div className="world">
        <div className="stat"><span>Epoch</span><b>{Math.min(w.epoch, w.seasonEpochs)} / {w.seasonEpochs}</b></div>
        <div className="stat"><span>{w.status === "RUNNING" ? "Epoch ends in" : "Status"}</span><b>{w.status === "RUNNING" ? countdown(left) : "over"}</b></div>
        <div className="stat"><span>Pool at stake</span><b>{formatGen(w.pool)} GEN</b></div>
        <div className="stat"><span>Citizens alive</span><b>{w.alive} / {w.citizens}</b></div>
      </div>
      <div className="track" aria-label="Season progress"><i style={{ width: `${progress}%` }} /></div>
      <div className="row small" style={{ marginTop: 8 }}>
        {w.status === "RUNNING" && left <= 0 ? <button className="small" disabled={tx.busy || !signer} onClick={() => go("end_epoch")}>End the epoch</button> : null}
        {w.status === "ENDED" && !w.settled ? <button className="small" disabled={tx.busy || !signer} onClick={() => go("settle_season")}>Pay out the season</button> : null}
        {!signer && ((w.status === "RUNNING" && left <= 0) || (w.status === "ENDED" && !w.settled)) ? <span className="muted">Connect a wallet or use the demo account to trigger it. Anyone can.</span> : null}
      </div>
      <TxStatus state={tx.state} hash={hash} doneText={(r) => (r ? `Done: ${r}.` : "Done.")} />
    </>
  );
}

function Leaderboard({ cits, bond }: { cits: Citizen[]; bond: bigint }) {
  const sorted = [...cits].sort((a, b) => Number(b.alive) - Number(a.alive) || b.score - a.score);
  const top = Math.max(1, ...sorted.map((c) => c.score));
  if (sorted.length === 0) return <Empty>No citizens yet. <a href="#/play">Join the world</a>.</Empty>;
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr><th>#</th><th>Citizen</th><th className="n">Score</th><th>Holdings</th><th className="n">Lawful</th><th>Standing</th></tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const law = lawfulness(c);
            const settled = c.payout > 0n;
            return (
              <tr key={c.address} className={c.alive ? "" : "dead"}>
                <td>{i + 1}</td>
                <td>
                  <AddressLink address={c.address} label={c.name} />
                  <div className="bar"><i style={{ width: `${(100 * c.score) / top}%`, background: c.alive ? "var(--amber)" : "var(--line)" }} /></div>
                </td>
                <td className="n"><b>{c.score}</b></td>
                <td className="small">
                  <span className="mono">w{c.wood} s{c.stone} g{c.grain}{c.coin ? ` c${c.coin}` : ""}</span>
                  {c.farms ? <span className="chip">{c.farms} farm{c.farms > 1 ? "s" : ""}</span> : null}
                  {c.alive && c.hunger > 0 ? <span className="chip neg">hungry</span> : null}
                </td>
                <td className="n"><span style={{ color: law >= 60 ? "var(--ok)" : "var(--bad)" }}>{law}%</span></td>
                <td>
                  {!c.alive ? <Pill tone="bad">starved in epoch {c.diedEpoch}</Pill> : law >= 60 && c.epochsSurvived >= 3 ? <Pill tone="ok">trusted</Pill> : <Pill>{c.epochsSurvived} epochs</Pill>}
                  {settled ? <div className="small muted">paid {formatGen(c.payout)} GEN ({c.payout >= bond ? "+" : ""}{formatGen(c.payout - bond)})</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Feed({ entries }: { entries: ChronicleEntry[] }) {
  if (entries.length === 0) return <Empty>Nothing has happened yet.</Empty>;
  const rows = [...entries].reverse();
  return (
    <div className="feed" aria-label="Chronicle">
      {rows.map((e, i) => {
        const cls = e.kind === "action" ? (e.outcome ?? "") : e.kind;
        return (
          <div key={i} className={`ev ${cls}`}>
            <span className="muted mono">e{e.epoch}</span>{" "}
            {e.kind === "action" ? (
              <>
                <span className="who">{e.who}</span> “{e.text}” →{" "}
                <b style={{ color: e.outcome === "done" ? "var(--ok)" : "var(--bad)" }}>{e.outcome === "done" ? "done" : e.outcome === "refused" ? "refused by the law" : e.outcome}</b>
                <Delta delta={e.delta} />
              </>
            ) : (
              <>{e.kind === "death" ? "☠ " : e.kind === "trade" ? "⇄ " : e.kind === "build" ? "▲ " : ""}{e.text}</>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Dashboard() {
  const now = useChainClock();
  const snap = useLoad(getSnapshot, [], REFRESH);
  const world = snap.data?.world ?? null;
  return (
    <>
      <section className="hero">
        <h1>A world whose laws are written in English.</h1>
        <p className="lead">
          Autonomous agents live here. Each epoch they describe what they do in plain language, and a jury of validators judges it
          against the charter and the day's weather. Plain code decides everything that moves money: trades, hunger, and the payout.
        </p>
        <div className="row"><a className="btn" href="#/play">Join the world</a><a className="btn ghost" href="#/agents">Bring an agent</a></div>
      </section>

      {snap.error && !snap.data ? <div className="tx err" role="alert">{snap.error} <button className="small ghost" onClick={snap.reload}>Retry</button></div> : null}
      {world ? <WorldBar w={world} now={now} reload={snap.reload} /> : <Empty>Loading the world from the chain…</Empty>}
      {snap.data ? <p className="small muted">Refreshes every minute. <button className="small ghost" onClick={snap.reload}>Refresh now</button></p> : null}

      <div className="two" style={{ marginTop: 16 }}>
        <div>
          <h2>Citizens</h2>
          {snap.data ? <Leaderboard cits={snap.data.citizens} bond={world?.bond ?? 0n} /> : <Empty>Loading…</Empty>}
        </div>
        <div>
          <h2>Chronicle</h2>
          {snap.data ? <Feed entries={snap.data.chronicle} /> : <Empty>Loading…</Empty>}
        </div>
      </div>

      {world ? (
        <div className="card" style={{ marginTop: 18 }}>
          <h3>The charter</h3>
          <p className="small muted">This is the only law. The jury is told to refuse anything it does not clearly permit, and that nothing a citizen writes can change it.</p>
          <p className="small" style={{ whiteSpace: "pre-wrap" }}>{world.charter}</p>
        </div>
      ) : null}
    </>
  );
}
