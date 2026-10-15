import { useState } from "react";
import { lawfulPct } from "../lib/derive.ts";
import { useWorld } from "../world-context.tsx";
import { CitizenEmblem, EmptyState, ErrorState, SectionHeader, Skeleton, StatusBadge, Tabs } from "../components/kit.tsx";

type Filter = "all" | "alive" | "starved";

export function CitizensPage() {
  const { snapshot, error, loading, reload } = useWorld();
  const [filter, setFilter] = useState<Filter>("all");
  const citizens = snapshot?.citizens ?? [];
  const shown = [...citizens]
    .filter((c) => (filter === "all" ? true : filter === "alive" ? c.alive : !c.alive))
    .sort((a, b) => Number(b.alive) - Number(a.alive) || b.score - a.score);

  return (
    <div className="page">
      <SectionHeader as="h1" title="Citizens" eyebrow="The people of the commonwealth">
        <Tabs<Filter> label="Filter citizens" active={filter} onChange={setFilter} tabs={[{ id: "all", label: `All (${citizens.length})` }, { id: "alive", label: `Alive (${citizens.filter((c) => c.alive).length})` }, { id: "starved", label: `Starved (${citizens.filter((c) => !c.alive).length})` }]} />
      </SectionHeader>
      {error && !snapshot ? <ErrorState message={error} onRetry={reload} /> : loading && !snapshot ? <div className="panel panel-paper"><Skeleton lines={5} /></div> : shown.length === 0 ? (
        <EmptyState icon="citizens" title={citizens.length === 0 ? "No citizens yet" : "No citizens match this filter"}>
          {citizens.length === 0 ? <>Anyone can join with a bond from the <a href="#/play">Play</a> page.</> : "Try another filter."}
        </EmptyState>
      ) : (
        <ul className="citizen-grid" role="tabpanel" aria-label="Citizens">
          {shown.map((c) => (
            <li key={c.address}>
              <a className={`citizen-card ${c.alive ? "" : "is-dead"}`} href={`#/citizen/${c.address}`}>
                <CitizenEmblem address={c.address} name={c.name} size={54} dead={!c.alive} />
                <div className="cc-main">
                  <strong className="cc-name">{c.name}</strong>
                  {c.alive ? <StatusBadge tone="ok">Alive</StatusBadge> : <StatusBadge tone="bad" icon="skull">Starved, epoch {c.diedEpoch}</StatusBadge>}
                </div>
                <dl className="cc-stats">
                  <div><dt>Score</dt><dd>{c.score}</dd></div>
                  <div><dt>Lawful</dt><dd>{lawfulPct(c)}%</dd></div>
                  <div><dt>Epochs</dt><dd>{c.epochsSurvived}</dd></div>
                </dl>
                <p className="cc-hold mono">wood {c.wood} · stone {c.stone} · grain {c.grain}{c.farms ? ` · ${c.farms} farm${c.farms > 1 ? "s" : ""}` : ""}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
