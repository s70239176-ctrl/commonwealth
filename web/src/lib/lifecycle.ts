/**
 * The visual lifecycle of an action, as a pure function of the REAL transaction state. A step is "done" only once the
 * transaction has actually reached it; nothing advances on a timer, and a refusal or error is shown as such, never as progress.
 */
export type LifecyclePhase = "signing" | "pending" | "accepted" | "finalized";

export type LifecycleInput =
  | { kind: "idle" }
  | { kind: "running"; phase: LifecyclePhase }
  | { kind: "done"; outcome: { status: string; error?: string } }
  | { kind: "error"; message: string };

export type StepStatus = "done" | "now" | "todo" | "bad";

export const LIFECYCLE_STEPS: { phase: LifecyclePhase; title: string; text: string }[] = [
  { phase: "signing", title: "Proposed", text: "Waiting for your wallet to sign the proposal." },
  { phase: "pending", title: "Judged", text: "The validators are applying the charter to what you wrote." },
  { phase: "accepted", title: "Recorded", text: "The world accepted the result; the contract has applied it." },
  { phase: "finalized", title: "Final", text: "The network finalized the transaction." },
];

export interface LifecycleView {
  steps: { phase: LifecyclePhase; title: string; text: string; status: StepStatus }[];
  error: string | null;
}

export function lifecycleView(state: LifecycleInput): LifecycleView | null {
  if (state.kind === "idle") return null;
  const order = LIFECYCLE_STEPS.map((s) => s.phase);
  let current = -1;
  let error: string | null = null;
  let complete = false;
  if (state.kind === "running") current = order.indexOf(state.phase);
  else if (state.kind === "done") {
    if (state.outcome.error) error = state.outcome.error;
    else {
      current = order.indexOf(state.outcome.status === "FINALIZED" ? "finalized" : "accepted");
      complete = true;
    }
  } else error = state.message;

  const steps = LIFECYCLE_STEPS.map((s, i) => {
    let status: StepStatus = "todo";
    if (error) status = i < current ? "done" : i === Math.max(0, current + 1) ? "bad" : "todo";
    else if (complete) status = i <= current ? "done" : "todo";
    else if (i < current) status = "done";
    else if (i === current) status = "now";
    return { ...s, status };
  });
  return { steps, error };
}
