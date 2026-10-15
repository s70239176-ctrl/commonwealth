import { useState } from "react";
import { describeError, standing } from "../lib/chain.ts";
import { formatGen } from "../lib/format.ts";
import { activityOf, lawfulPct, offersOf } from "../lib/derive.ts";
import { useSession } from "../wallet-context.ts";
import { useWorld } from "../world-context.tsx";
import { CodeBlock } from "../components/CodeBlock.tsx";
import { SplitBar } from "../components/charts.tsx";
import { Icon } from "../components/Icons.tsx";
import { CitizenEmblem, Copyable, EmptyState, ErrorState, Holdings, SectionHeader, Skeleton, Stat, StatusBadge, TabPanel, Tabs } from "../components/kit.tsx";
import { EventRow } from "../components/events.tsx";

type Section = "overview" | "holdings" | "activity" | "reputation";

export function CitizenPage({ address }: { address: string }) {
  const { snapshot, error, loading, reload } = useWorld();
  const { me } = useSession();
  const [tab, setTab] = useState<Section>("overview");
  const [minEpochs, setMinEpochs] = useState("3");
  const [minLaw, setMinLaw] = useState("60");
  const [gate, setGate] = useState<{ ok: boolean; for: string } | null>(null);
  const [gateErr, setGateErr] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  if (!snapshot) return error ? <div className="page"><ErrorState message={error} onRetry={reload} /></div> : <div className="page"><div className="panel panel-paper"><Skeleton lines={5} /></div></div>;
  void loading;

  const c = snapshot.citizens.find((x) => x.address === address);
  if (!c) {
    return (
      <div className="page">
        <p><a href="#/citizens">← All citizens</a></p>
        <EmptyState icon="user" title="No citizen with this address">It may not have joined this world. <span className="mono">{address}</span></EmptyState>
      </div>
    );
  }

  const w = snapshot.world;
  const law = lawfulPct(c);
  const log = activityOf(snapshot.chronicle, c.name);
  const acts = log.filter((e) => e.kind === "action");
  const offers = offersOf(snapshot.offers, c.address);
  const mine = me === c.address;
  const settled = w.settled && c.payout >= 0n && w.status === "ENDED";

  async function check() {
    setGateErr(null);
    setGateBusy(true);
    try {
      const ok = await standing(address, Math.max(0, Math.trunc(Number(minEpochs)) || 0), Math.max(0, Math.trunc(Number(minLaw)) || 0));
      setGate({ ok, for: `${Math.trunc(Number(minEpochs)) || 0} epochs, ${Math.trunc(Number(minLaw)) || 0}% lawful` });
    } catch (e) {
      setGate(null);
      setGateErr(describeError(e));
    } finally {
      setGateBusy(false);
    }
  }

  return (
    <div className="page">
      <p className="backlink"><a href="#/citizens"><Icon name="arrow" size={14} className="flip" /> All citizens</a></p>
      <section className="dossier" aria-labelledby="citizen-title">
        <div className="dossier-art" aria-hidden="true" />
        <CitizenEmblem address={c.address} name={c.name} size={96} dead={!c.alive} />
        <div className="dossier-main">
          <div className="row">
            <h1 id="citizen-title" className="display display-sm">{c.name}</h1>
            {c.alive ? <StatusBadge tone="ok">Alive</StatusBadge> : <StatusBadge tone="bad" icon="skull">Starved in epoch {c.diedEpoch}</StatusBadge>}
            {mine ? <StatusBadge tone="info" icon="user">This is you</StatusBadge> : null}
          </div>
          <p className="dossier-sub">Joined in epoch {c.joinedEpoch}. {c.alive ? "Still living in the commonwealth." : "No longer able to act."}</p>
          <p className="dossier-addr"><Copyable value={c.address} label="citizen address" shorten={false} /></p>
          <div className="row">
            {mine && w.status === "RUNNING" ? <a className="btn btn-primary btn-sm" href="#/play">Propose an action</a> : null}
            {!mine && c.alive && w.status === "RUNNING" ? <a className="btn btn-quiet btn-sm" href="#/market">Make a trade offer</a> : null}
          </div>
        </div>
      </section>

      <section className="stats stats-4" aria-label="Citizen statistics">
        <Stat label="Score" value={c.score} hint="holdings plus 6 per farm" />
        <Stat label="Lawfulness" value={`${law}%`} tone={law >= 60 ? "ok" : "bad"} hint={`${c.actionsDone} allowed, ${c.refused} refused`} />
        <Stat label="Survival" value={c.alive ? "Alive" : "Starved"} tone={c.alive ? "ok" : "bad"} hint={c.alive && c.hunger > 0 ? `${c.hunger} hungry epoch${c.hunger > 1 ? "s" : ""}` : undefined} />
        <Stat label="Epochs survived" value={c.epochsSurvived} hint={`of ${w.seasonEpochs} in the season`} />
      </section>

      <div className="panel panel-paper tabbed">
        <Tabs<Section> label="Citizen sections" active={tab} onChange={setTab} tabs={[{ id: "overview", label: "Overview" }, { id: "holdings", label: "Holdings" }, { id: "activity", label: `Activity (${log.length})` }, { id: "reputation", label: "Reputation" }]} />

        <TabPanel id="overview" active={tab === "overview"}>
          <div className="cols cols-even">
            <div>
              <SectionHeader as="h2" title="Judged actions" />
              {c.actionsDone + c.refused === 0 ? <EmptyState icon="scroll" title="Nothing judged yet">Their record starts once the jury has ruled on an action.</EmptyState> : (
                <>
                  <SplitBar done={c.actionsDone} refused={c.refused} />
                  <p className="panel-note">{c.actionsDone} allowed and {c.refused} refused, across {c.batches} batch{c.batches === 1 ? "" : "es"}.</p>
                </>
              )}
              <SectionHeader as="h2" title="Trades" />
              <p>{c.trades === 0 ? "No trades completed." : `${c.trades} trade${c.trades === 1 ? "" : "s"} completed.`} {offers.length > 0 ? `${offers.length} open offer${offers.length === 1 ? "" : "s"} involve this citizen.` : ""}</p>
            </div>
            <div>
              <SectionHeader as="h2" title="Bond and payout" />
              <dl className="kv">
                <dt>Bond</dt><dd>{formatGen(c.bond)} GEN</dd>
                <dt>Payout</dt><dd>{settled ? <>{formatGen(c.payout)} GEN {c.payout === 0n ? <StatusBadge tone="bad">Forfeited</StatusBadge> : <StatusBadge tone={c.payout >= c.bond ? "ok" : "warn"}>{c.payout >= c.bond ? "Above the bond" : "Below the bond"}</StatusBadge>}</> : <span className="muted">Not paid out yet</span>}</dd>
              </dl>
              <p className="panel-note">The contract keeps no per-epoch history of a citizen's score or holdings, so this page shows current values and the retained chronicle, not a time series.</p>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="holdings" active={tab === "holdings"}>
          <SectionHeader as="h2" title="Current holdings" eyebrow="Read from the contract" />
          <Holdings values={{ wood: c.wood, stone: c.stone, grain: c.grain, coin: c.coin }} />
          <p className="panel-note">{c.farms} farm{c.farms === 1 ? "" : "s"} owned. Quantities have no maximum, so no bars are drawn. Coin only changes through trades.</p>
        </TabPanel>

        <TabPanel id="activity" active={tab === "activity"}>
          <SectionHeader as="h2" title="Recorded activity" eyebrow="From the retained chronicle" />
          {log.length === 0 ? <EmptyState icon="scroll" title="No recorded activity">Nothing for this citizen is in the contract's 60-entry chronicle.</EmptyState> : <ul className="events">{[...log].reverse().map((e, i) => <EventRow key={i} e={e} showWho={false} />)}</ul>}
          {acts.length > 0 ? <p className="panel-note">Earlier activity may have rolled out of the chronicle, so the counts in Overview can be larger than the list here.</p> : null}
        </TabPanel>

        <TabPanel id="reputation" active={tab === "reputation"}>
          <SectionHeader as="h2" title="Ask the gate" eyebrow="Free, no model, no consensus" />
          <p className="panel-note">Any contract or agent can call <span className="mono">standing</span> before dealing with this citizen. It checks that they are alive, have survived enough epochs and are lawful enough.</p>
          <div className="row row-end">
            <div className="field-inline"><label className="field" htmlFor="min-epochs"><span>Epochs survived at least</span></label><input id="min-epochs" className="input" inputMode="numeric" value={minEpochs} onChange={(e) => { setMinEpochs(e.target.value); setGate(null); }} /></div>
            <div className="field-inline"><label className="field" htmlFor="min-law"><span>Lawful at least (%)</span></label><input id="min-law" className="input" inputMode="numeric" value={minLaw} onChange={(e) => { setMinLaw(e.target.value); setGate(null); }} /></div>
            <button className="btn btn-primary" onClick={check} disabled={gateBusy}>{gateBusy ? "Asking…" : "Ask the gate"}</button>
          </div>
          <div aria-live="polite">
            {gate ? <div className={`notice ${gate.ok ? "notice-ok" : "notice-bad"}`}><Icon name={gate.ok ? "check" : "cross"} size={16} /> standing(…) for {gate.for} → <b>{String(gate.ok)}</b></div> : null}
            {gateErr ? <div className="notice notice-bad" role="alert"><Icon name="cross" size={16} /> {gateErr}</div> : null}
          </div>
          <CodeBlock label="The same call from code" code={`await client.readContract({\n  address: CONTRACT, functionName: "standing",\n  args: ["${c.address}", ${Math.trunc(Number(minEpochs)) || 0}n, ${Math.trunc(Number(minLaw)) || 0}n],\n});`} />
        </TabPanel>
      </div>
    </div>
  );
}
