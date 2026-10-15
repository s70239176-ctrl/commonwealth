import type { ChronicleEntry } from "../lib/types.ts";
import { RESOURCES } from "../lib/types.ts";
import { Icon, type IconName } from "./Icons.tsx";
import { StatusBadge, type Tone } from "./kit.tsx";

export function outcomeText(o: string | null): string {
  switch (o) {
    case "done": return "Allowed";
    case "refused": return "Refused by the law";
    case "land_exhausted": return "Common land already taken";
    case "overdraft": return "Not enough to pay for it";
    case "too_much_gain": return "More than the world allows";
    default: return o ?? "";
  }
}

const outcomeTone = (o: string | null): Tone => (o === "done" ? "ok" : o === "land_exhausted" ? "warn" : "bad");

function kindIcon(e: ChronicleEntry): IconName {
  switch (e.kind) {
    case "action": return e.outcome === "done" ? "check" : "cross";
    case "trade": return "trade";
    case "build": return "farm";
    case "death": return "skull";
    case "join": return "user";
    case "epoch": return "clock";
    case "season": return "leaf";
    case "payout": return "coin";
    default: return "spark";
  }
}

/** One confirmed on-chain event from the contract's chronicle. Nothing here is a pending or off-chain event. */
export function EventRow({ e, showWho = true }: { e: ChronicleEntry; showWho?: boolean }) {
  const delta = e.delta ? RESOURCES.filter((r) => e.delta?.[r]) : [];
  return (
    <li className={`event event-${e.kind} ${e.kind === "action" ? `event-${e.outcome === "done" ? "ok" : "no"}` : ""}`}>
      <span className="event-icon"><Icon name={kindIcon(e)} size={17} /></span>
      <div className="event-body">
        <p className="event-title">
          {e.kind === "action" ? (
            <>{showWho ? <b>{e.who} </b> : null}<span className="event-quote">“{e.text}”</span></>
          ) : (
            e.text
          )}
        </p>
        <div className="event-meta">
          <span className="mono">{e.kind === "season" || e.kind === "payout" ? "Season end" : `Epoch ${e.epoch}`}</span>
          {e.kind === "action" ? <StatusBadge tone={outcomeTone(e.outcome)}>{outcomeText(e.outcome)}</StatusBadge> : null}
          {delta.map((r) => (
            <span key={r} className={`delta ${(e.delta?.[r] ?? 0) > 0 ? "delta-pos" : "delta-neg"}`}>
              {(e.delta?.[r] ?? 0) > 0 ? "+" : ""}{e.delta?.[r]} {r}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}
