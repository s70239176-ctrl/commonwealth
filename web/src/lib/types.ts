export type Resource = "wood" | "stone" | "grain" | "coin";
export const RESOURCES: Resource[] = ["wood", "stone", "grain", "coin"];

export interface Conditions {
  epoch: number;
  season: string;
  event: string;
}

export interface World {
  charter: string;
  status: "RUNNING" | "ENDED";
  epoch: number;
  seasonEpochs: number;
  epochSeconds: number;
  nextEpochAt: number;
  bond: bigint;
  pool: bigint;
  citizens: number;
  alive: number;
  settled: boolean;
  conditions: Conditions;
}

export interface Citizen {
  address: string;
  name: string;
  alive: boolean;
  score: number;
  wood: number;
  stone: number;
  grain: number;
  coin: number;
  farms: number;
  bond: bigint;
  hunger: number;
  joinedEpoch: number;
  diedEpoch: number;
  epochsSurvived: number;
  batches: number;
  actionsDone: number;
  refused: number;
  trades: number;
  payout: bigint;
  /** present on get_record only */
  lawfulnessPct: number | null;
}

export type ChronicleKind = "join" | "action" | "trade" | "build" | "death" | "epoch" | "season" | "payout";

export interface ChronicleEntry {
  epoch: number;
  kind: ChronicleKind;
  who: string;
  text: string;
  outcome: string | null;
  delta: Partial<Record<Resource, number>> | null;
}

export interface Offer {
  id: number;
  from: string;
  to: string;
  give: Partial<Record<Resource, number>>;
  want: Partial<Record<Resource, number>>;
  epoch: number;
}

export interface Snapshot {
  world: World;
  citizens: Citizen[];
  chronicle: ChronicleEntry[];
  offers: Offer[];
}

export type Phase = "signing" | "pending" | "accepted" | "finalized";

export interface TxOutcome {
  hash: string;
  status: string;
  error?: string;
  result?: string;
  id?: number;
}
