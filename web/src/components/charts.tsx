import type { EpochBucket } from "../lib/derive.ts";

/**
 * Small SVG charts. They render ONLY when given real data; callers show an empty state otherwise. Each chart carries a text
 * summary for screen readers, and a data table is available beside it.
 */

export function OutcomeBars({ buckets }: { buckets: EpochBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.done + b.refused + b.other));
  const W = 560;
  const H = 190;
  const padL = 30;
  const padB = 26;
  const bw = Math.min(56, (W - padL - 10) / Math.max(1, buckets.length) - 12);
  const step = (W - padL - 10) / Math.max(1, buckets.length);
  const y = (v: number) => H - padB - ((H - padB - 14) * v) / max;
  const summary = buckets.map((b) => `epoch ${b.epoch}: ${b.done} allowed, ${b.refused} refused${b.other ? `, ${b.other} other` : ""}`).join("; ");
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Judged actions per epoch. ${summary}`}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 6} y1={y(max * t)} y2={y(max * t)} className="chart-grid" />
            <text x={padL - 6} y={y(max * t) + 4} textAnchor="end" className="chart-axis">{Math.round(max * t)}</text>
          </g>
        ))}
        {buckets.map((b, i) => {
          const x = padL + i * step + (step - bw) / 2;
          const hDone = y(0) - y(b.done);
          const hRef = y(0) - y(b.refused);
          const hOth = y(0) - y(b.other);
          return (
            <g key={b.epoch} className="chart-bar">
              <rect x={x} y={y(0) - hDone} width={bw} height={hDone} className="bar-done" />
              <rect x={x} y={y(0) - hDone - hRef} width={bw} height={hRef} className="bar-refused" />
              <rect x={x} y={y(0) - hDone - hRef - hOth} width={bw} height={hOth} className="bar-other" />
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="chart-axis">E{b.epoch}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="chart-legend">
        <span><i className="sw bar-done" /> Allowed</span>
        <span><i className="sw bar-refused" /> Refused</span>
        <span><i className="sw bar-other" /> Clipped or other</span>
      </figcaption>
      <details className="chart-table">
        <summary>View as a table</summary>
        <table>
          <thead><tr><th>Epoch</th><th>Allowed</th><th>Refused</th><th>Other</th></tr></thead>
          <tbody>{buckets.map((b) => <tr key={b.epoch}><td>{b.epoch}</td><td>{b.done}</td><td>{b.refused}</td><td>{b.other}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

export function ScoreBars({ rows }: { rows: { id: string; label: string; value: number; muted?: boolean }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="score-bars" aria-label="Scores">
      {rows.map((r) => (
        <li key={r.id} className={r.muted ? "is-muted" : ""}>
          <span className="sb-label">{r.label}</span>
          <span className="sb-track"><i style={{ width: `${(100 * r.value) / max}%` }} /></span>
          <span className="sb-value">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Allowed versus refused as a single proportion bar, for one citizen or the whole world. */
export function SplitBar({ done, refused, other = 0 }: { done: number; refused: number; other?: number }) {
  const total = done + refused + other;
  if (total === 0) return null;
  const pc = (n: number) => `${(100 * n) / total}%`;
  return (
    <div className="split" role="img" aria-label={`${done} allowed, ${refused} refused${other ? `, ${other} other` : ""} out of ${total} judged actions`}>
      <i className="bar-done" style={{ width: pc(done) }} />
      <i className="bar-other" style={{ width: pc(other) }} />
      <i className="bar-refused" style={{ width: pc(refused) }} />
    </div>
  );
}
