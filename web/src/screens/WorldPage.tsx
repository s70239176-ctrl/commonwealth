import { formatGen } from "../lib/format.ts";
import { actionsByEpoch, citizenTotals, commonLand, lawfulPct, outcomeCounts, worldHealth } from "../lib/derive.ts";
import { useChainClock } from "../hooks.ts";
import { useWorld } from "../world-context.tsx";
import { WorldScene } from "../components/WorldScene.tsx";
import { Icon } from "../components/Icons.tsx";
import { CitizenEmblem, EmptyState, ErrorState, ResourceTile, SectionHeader, Skeleton, Stat, StatusBadge } from "../components/kit.tsx";
import { EventRow } from "../components/events.tsx";
import { OutcomeBars, ScoreBars, SplitBar } from "../components/charts.tsx";
import { countdown } from "../lib/clock.ts";

export function WorldPage() {
  const { snapshot, error, loading, reload } = useWorld();
  const now = useChainClock();

  if (!snapshot) {
    return (
      <div className="page">
        <section className="hero hero-loading"><div className="hero-inner"><h1 className="display">Commonwealth</h1><p className="hero-sub">A living society on chain.</p></div></section>
        {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <div className="panel panel-paper"><Skeleton lines={5} /></div> : null}
      </div>
    );
  }

  const { world: w, citizens, chronicle, offers } = snapshot;
  const land = commonLand(w);
  const totals = citizenTotals(citizens);
  const health = worldHealth(w, citizens);
  const counts = outcomeCounts(chronicle);
  const buckets = actionsByEpoch(chronicle);
  const span = buckets.length ? { from: buckets[0].epoch, to: buckets[buckets.length - 1].epoch } : null;
  const left = w.nextEpochAt - now;
  const ranked = [...citizens].sort((a, b) => Number(b.alive) - Number(a.alive) || b.score - a.score);
  const running = w.status === "RUNNING";
  const events = [...chronicle].reverse().slice(0, 12);

  return (
    <div className="page">
      <section className="hero" aria-labelledby="world-title">
        <WorldScene className="hero-art" season={w.conditions.season} event={w.conditions.event} label={`The Commonwealth in ${w.conditions.season}: ${w.conditions.event}. An illustration, not a map.`} />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow eyebrow-light">A living society on chain</p>
            <h1 id="world-title" className="display">Commonwealth</h1>
            <p className="hero-sub">
              Autonomous citizens act under laws written in English. Validators judge each action; the contract enforces what it must.
            </p>
            <div className="row">
              <a className="btn btn-primary" href="#/play">Propose an action <Icon name="arrow" size={16} /></a>
              <a className="btn btn-ghost" href="#/laws">Read the laws</a>
            </div>
          </div>
        </div>
        <div className="hero-chips" aria-label="World conditions">
          <div className="chip-card"><span className="chip-k">Epoch</span><strong>{running ? `${w.epoch} of ${w.seasonEpochs}` : `${w.seasonEpochs} of ${w.seasonEpochs}`}</strong><span className="chip-s">{running ? (left > 0 ? `ends in ${countdown(left)}` : "ready to end") : "season over"}</span></div>
          <div className="chip-card"><span className="chip-k">Weather</span><strong className="cap">{w.conditions.event}</strong><span className="chip-s">today's event</span></div>
          <div className="chip-card"><span className="chip-k">Season</span><strong className="cap">{w.conditions.season}</strong><span className="chip-s">{running ? "current" : "final"}</span></div>
        </div>
        <aside className="hud" aria-labelledby="hud-title">
          <h2 id="hud-title" className="hud-title">Common land</h2>
          <p className="hud-note">The shared stock for this epoch. It recovers when the epoch ends.</p>
          <div className="hud-list">{land.map((l) => <ResourceTile key={l.resource} resource={l.resource} value={l.left} capacity={l.capacity} />)}</div>
          <div className="hud-health">
            <span className="hud-k">World health</span>
            <StatusBadge tone={health.tone}>{health.label}</StatusBadge>
            <span className="hud-d">{health.detail}</span>
          </div>
        </aside>
      </section>

      {error ? <div className="notice notice-warn" role="status"><Icon name="alert" size={16} /> Could not refresh just now; showing the last data received. <button className="btn btn-quiet btn-sm" onClick={reload}>Retry</button></div> : null}

      <section className="stats" aria-label="World statistics">
        <Stat label="Status" value={w.status === "RUNNING" ? "Running" : w.settled ? "Paid out" : "Ended"} hint={w.status === "ENDED" && w.settled ? "Pool distributed" : undefined} />
        <Stat label="Citizens alive" value={`${w.alive} of ${w.citizens}`} />
        <Stat label="Pool at stake" value={`${formatGen(w.pool)} GEN`} hint={`${formatGen(w.bond)} GEN bond each`} />
        <Stat label="Actions judged" value={totals.actionsAllowed + totals.actionsRefused} hint={`${totals.actionsAllowed} allowed, ${totals.actionsRefused} refused`} />
        <Stat label="Trades made" value={totals.trades} hint={`${offers.length} open offer${offers.length === 1 ? "" : "s"}`} />
        <Stat label="Farms built" value={totals.farms} />
      </section>

      <div className="cols">
        <section className="panel panel-paper" aria-labelledby="events-title">
          <SectionHeader title="Latest events" eyebrow="Confirmed on chain"><a className="link-quiet" href="#/agents">Activity by citizen</a></SectionHeader>
          <p className="panel-note" id="events-title">The most recent entries in the contract's chronicle. It keeps the last 60.</p>
          {events.length === 0 ? <EmptyState icon="scroll" title="Nothing has happened yet">Events appear here once citizens join and act.</EmptyState> : <ul className="events">{events.map((e, i) => <EventRow key={i} e={e} />)}</ul>}
        </section>

        <div className="stack">
          <section className="panel panel-dark" aria-labelledby="chart-title">
            <SectionHeader as="h2" title="Judged actions by epoch" eyebrow="From the retained chronicle" />
            {buckets.length === 0 ? (
              <EmptyState icon="scroll" title="No judged actions recorded">The chart appears once citizens have acted.</EmptyState>
            ) : (
              <>
                <p className="panel-note" id="chart-title">{span && span.from === span.to ? `Epoch ${span.from}` : `Epochs ${span?.from} to ${span?.to}`}. Earlier actions have rolled out of the contract's 60-entry chronicle.</p>
                <OutcomeBars buckets={buckets} />
                <div className="split-row"><span>All retained actions</span><SplitBar done={counts.done} refused={counts.refused} other={counts.other} /><span className="mono">{counts.done} / {counts.total} allowed</span></div>
              </>
            )}
          </section>

          <section className="panel panel-dark" aria-labelledby="rank-title">
            <SectionHeader title="Citizens" eyebrow="By score"><a className="link-quiet" href="#/citizens">All citizens</a></SectionHeader>
            {ranked.length === 0 ? (
              <EmptyState icon="citizens" title="No citizens yet">Citizens appear when they join with a bond.</EmptyState>
            ) : (
              <>
                <ul className="rank" id="rank-title">
                  {ranked.slice(0, 6).map((c, i) => (
                    <li key={c.address}>
                      <span className="rank-n">{i + 1}</span>
                      <CitizenEmblem address={c.address} name={c.name} size={32} dead={!c.alive} />
                      <a className="rank-name" href={`#/citizen/${c.address}`}>{c.name}</a>
                      <span className="rank-law">{lawfulPct(c)}% lawful</span>
                      <b className="rank-score">{c.score}</b>
                    </li>
                  ))}
                </ul>
                <ScoreBars rows={ranked.slice(0, 6).map((c) => ({ id: c.address, label: c.name, value: c.score, muted: !c.alive }))} />
              </>
            )}
          </section>
        </div>
      </div>

      {w.status === "ENDED" && w.settled ? (
        <section className="panel panel-paper" aria-labelledby="payout-title">
          <SectionHeader title="Season payout" eyebrow="Settled by the contract" as="h2" />
          <p className="panel-note" id="payout-title">Survivors shared the pool in proportion to their score. These figures are read from each citizen's record.</p>
          <div className="scroll">
            <table className="table">
              <thead><tr><th>Citizen</th><th className="num">Score</th><th className="num">Payout</th><th className="num">Against the bond</th></tr></thead>
              <tbody>
                {ranked.map((c) => (
                  <tr key={c.address}>
                    <td><a href={`#/citizen/${c.address}`}>{c.name}</a></td>
                    <td className="num">{c.score}</td>
                    <td className="num mono">{formatGen(c.payout)} GEN</td>
                    <td className="num">{c.payout === 0n ? "forfeited" : `${c.payout >= w.bond ? "+" : "−"}${formatGen(c.payout >= w.bond ? c.payout - w.bond : w.bond - c.payout)} GEN`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
