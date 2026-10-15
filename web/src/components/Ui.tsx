import type { ReactNode } from "react";
import { EXPLORER } from "../lib/chain.ts";
import { shortAddr } from "../lib/format.ts";
import type { Phase, Resource } from "../lib/types.ts";
import { RESOURCES } from "../lib/types.ts";
import type { TxState } from "../hooks.ts";

export function Pill({ tone, children }: { tone?: "ok" | "bad" | "warn" | "amber"; children: ReactNode }) {
  return <span className={`pill ${tone ?? ""}`}>{children}</span>;
}

export function TxLink({ hash }: { hash: string }) {
  return (
    <a className="mono" href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer">
      {hash.slice(0, 10)}…
    </a>
  );
}

export function AddressLink({ address, label }: { address: string; label?: string }) {
  return (
    <a className="mono" href={`#/agent/${address}`} title={address}>
      {label ?? shortAddr(address)}
    </a>
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
    return (
      <div className="tx" role="status">
        {phaseText[state.phase]} {state.detail ? <span className="muted">({state.detail})</span> : null} {hash ? <TxLink hash={hash} /> : null}
      </div>
    );
  }
  if (state.kind === "error") return <div className="tx err" role="alert">{state.message}</div>;
  const o = state.outcome;
  if (o.error) return <div className="tx err" role="alert">{o.error} <TxLink hash={o.hash} /></div>;
  return <div className="tx ok" role="status">{doneText ? doneText(o.result) : "Done."} <TxLink hash={o.hash} /></div>;
}

/** Non-zero resource changes as small signed chips. */
export function Delta({ delta }: { delta: Partial<Record<Resource, number>> | null }) {
  if (!delta) return null;
  const items = RESOURCES.filter((r) => delta[r]);
  if (items.length === 0) return null;
  return (
    <>
      {items.map((r) => (
        <span key={r} className={`chip ${(delta[r] ?? 0) > 0 ? "pos" : "neg"}`}>
          {(delta[r] ?? 0) > 0 ? "+" : ""}
          {delta[r]} {r}
        </span>
      ))}
    </>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card muted">{children}</div>;
}

export function NeedSigner({ connect, demo }: { connect: () => void; demo: () => void }) {
  return (
    <div className="row">
      <button onClick={connect}>Connect wallet</button>
      <button className="ghost" onClick={demo}>Use demo account</button>
    </div>
  );
}

export function countdown(seconds: number): string {
  if (seconds <= 0) return "due now";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}
