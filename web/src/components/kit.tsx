import { useCallback, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { EXPLORER } from "../lib/chain.ts";
import { shortAddr } from "../lib/format.ts";
import { identityOf } from "../lib/derive.ts";
import type { Phase, Resource } from "../lib/types.ts";
import { RESOURCES } from "../lib/types.ts";
import type { TxState } from "../hooks.ts";
import { Icon, type IconName } from "./Icons.tsx";
import { lifecycleView } from "../lib/lifecycle.ts";
import { copyText } from "../lib/copy.ts";

export type Tone = "ok" | "warn" | "bad" | "muted" | "info";

const toneIcon: Record<Tone, IconName> = { ok: "check", warn: "clock", bad: "cross", muted: "clock", info: "spark" };

/** A status is never colour alone: it always carries an icon and a text label. */
export function StatusBadge({ tone = "muted", children, icon }: { tone?: Tone; children: ReactNode; icon?: IconName }) {
  return (
    <span className={`badge badge-${tone}`}>
      <Icon name={icon ?? toneIcon[tone]} size={13} />
      <span className="badge-text">{children}</span>
    </span>
  );
}

export function SectionHeader({ eyebrow, title, children, as: Tag = "h2" }: { eyebrow?: string; title: string; children?: ReactNode; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <Tag className="section-title">{title}</Tag>
      </div>
      {children ? <div className="section-actions">{children}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ""}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  );
}

const resourceName: Record<Resource, string> = { wood: "Wood", stone: "Stone", grain: "Grain", coin: "Coin" };
export const resourceLabel = (r: Resource): string => resourceName[r];

/** A resource figure. The bar is drawn ONLY when the real denominator is known (`capacity`). */
export function ResourceTile({ resource, value, capacity, caption }: { resource: Resource; value: number; capacity?: number; caption?: string }) {
  const known = typeof capacity === "number" && capacity > 0;
  const pct = known ? Math.max(0, Math.min(100, (100 * value) / (capacity as number))) : 0;
  return (
    <div className={`resource resource-${resource}`}>
      <span className="resource-icon"><Icon name={resource} size={22} /></span>
      <div className="resource-body">
        <div className="resource-head">
          <span className="resource-name">{resourceName[resource]}</span>
          <span className="resource-value">{value.toLocaleString("en-US")}{known ? <span className="resource-cap"> / {(capacity as number).toLocaleString("en-US")}</span> : null}</span>
        </div>
        {known ? (
          <div className="meter" role="img" aria-label={`${resourceName[resource]}: ${value} of ${capacity}`}><i style={{ width: `${pct}%` }} /></div>
        ) : null}
        {caption ? <span className="resource-caption">{caption}</span> : null}
      </div>
    </div>
  );
}

export function Holdings({ values }: { values: Record<Resource, number> }) {
  return (
    <div className="holdings">
      {RESOURCES.map((r) => <ResourceTile key={r} resource={r} value={values[r]} />)}
    </div>
  );
}

export function Skeleton({ lines = 3, height = 14 }: { lines?: number; height?: number }) {
  return (
    <div className="skeleton" role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => <i key={i} style={{ height, width: `${92 - ((i * 17) % 40)}%` }} />)}
    </div>
  );
}

export function EmptyState({ icon = "scroll", title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} size={26} />
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <Icon name="alert" size={22} />
      <div>
        <strong>Could not reach the world</strong>
        <p>{message}</p>
      </div>
      {onRetry ? <button className="btn btn-quiet btn-sm" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

/** Copy a technical identifier, with feedback that screen readers also hear. */
export function Copyable({ value, label, shorten = true }: { value: string; label?: string; shorten?: boolean }) {
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = useCallback(async () => {
    if (await copyText(value)) {
      setDone(true);
      setFailed(false);
      setTimeout(() => setDone(false), 1800);
    } else {
      setFailed(true);
      setTimeout(() => setFailed(false), 2500);
    }
  }, [value]);
  return (
    <span className="copyable">
      <code title={value}>{shorten ? shortAddr(value) : value}</code>
      <button className="icon-btn" onClick={copy} aria-label={`Copy ${label ?? "value"}`}>
        <Icon name={done ? "check" : "copy"} size={15} />
      </button>
      <span className="sr-only" role="status" aria-live="polite">{done ? "Copied" : failed ? "Copy failed" : ""}</span>
      {failed ? <span className="copy-failed">Copy blocked by the browser</span> : null}
    </span>
  );
}

export function TxLink({ hash }: { hash: string }) {
  return (
    <a className="mono" href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer" title={hash}>
      {hash.slice(0, 10)}…{hash.slice(-6)}
    </a>
  );
}

export function AddressLink({ address, label }: { address: string; label?: string }) {
  return <a className="mono" href={`#/citizen/${address}`} title={address}>{label ?? shortAddr(address)}</a>;
}

export function CitizenEmblem({ address, name, size = 44, dead }: { address: string; name: string; size?: number; dead?: boolean }) {
  const { hue, initials } = identityOf(address, name);
  return (
    <span className={`emblem ${dead ? "emblem-dead" : ""}`} style={{ width: size, height: size, fontSize: size * 0.38, ["--hue" as string]: hue }} aria-hidden="true">
      {initials}
    </span>
  );
}

// ------------------------------------------------------------------ action lifecycle (real transaction state only)
export function ActionLifecycle({ state }: { state: TxState }) {
  const view = lifecycleView(state);
  if (!view) return null;
  return (
    <div className="lifecycle" aria-label="Action progress">
      <ol>
        {view.steps.map((s) => (
          <li key={s.phase} className={`life-${s.status}`} aria-current={s.status === "now" ? "step" : undefined}>
            <span className="life-dot"><Icon name={s.status === "done" ? "check" : s.status === "bad" ? "cross" : "clock"} size={13} /></span>
            <span className="life-title">{s.title}</span>
            <span className="life-text">{s.status === "now" ? s.text : ""}</span>
          </li>
        ))}
      </ol>
      {view.error ? <p className="life-error" role="alert">{view.error}</p> : null}
    </div>
  );
}

const phaseText: Record<Phase, string> = {
  signing: "Waiting for your signature…",
  pending: "Submitted. The validators are judging…",
  accepted: "Accepted. Waiting for finalization…",
  finalized: "Finalized.",
};

export function TxStatus({ state, hash, doneText }: { state: TxState; hash?: string; doneText?: (result?: string) => string }) {
  if (state.kind === "idle") return null;
  if (state.kind === "running") {
    return <div className="notice" role="status"><Icon name="clock" size={16} /> {phaseText[state.phase]} {state.detail ? <span className="muted">({state.detail})</span> : null} {hash ? <TxLink hash={hash} /> : null}</div>;
  }
  if (state.kind === "error") return <div className="notice notice-bad" role="alert"><Icon name="cross" size={16} /> {state.message}</div>;
  const o = state.outcome;
  if (o.error) return <div className="notice notice-bad" role="alert"><Icon name="cross" size={16} /> {o.error} <TxLink hash={o.hash} /></div>;
  return <div className="notice notice-ok" role="status"><Icon name="check" size={16} /> {doneText ? doneText(o.result) : "Done."} <TxLink hash={o.hash} /></div>;
}

// ------------------------------------------------------------------ tabs
export function Tabs<T extends string>({ tabs, active, onChange, label }: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => { refs.current[i] = el; }}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          className={`tab ${active === t.id ? "tab-on" : ""}`}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, active, children }: { id: string; active: boolean; children: ReactNode }) {
  return <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={!active} tabIndex={0}>{active ? children : null}</div>;
}
