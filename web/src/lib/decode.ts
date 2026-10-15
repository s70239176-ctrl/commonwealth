/** Pure decoding: contract view dictionaries -> typed objects, and contract refusals -> plain language. */
import type { ChronicleEntry, ChronicleKind, Citizen, Offer, Resource, Snapshot, World } from "./types.ts";

export function plain(v: unknown): unknown {
  if (v instanceof Map) return Object.fromEntries([...v.entries()].map(([k, x]) => [String(k), plain(x)]));
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === "object" && !(v instanceof Uint8Array)) {
    return Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, plain(x)]));
  }
  return v;
}

export type Raw = Record<string, unknown>;
const big = (v: unknown): bigint => BigInt(v as never);
const num = (v: unknown): number => Number(v);

function bundle(v: unknown): Partial<Record<Resource, number>> {
  const out: Partial<Record<Resource, number>> = {};
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v as Raw)) out[k as Resource] = num(x);
  return out;
}

export function toWorld(r: Raw): World {
  const c = (r.conditions ?? {}) as Raw;
  return {
    charter: String(r.charter),
    status: String(r.status) as World["status"],
    epoch: num(r.epoch),
    seasonEpochs: num(r.season_epochs),
    epochSeconds: num(r.epoch_seconds),
    nextEpochAt: num(r.next_epoch_at),
    bond: big(r.bond),
    pool: big(r.pool),
    citizens: num(r.citizens),
    alive: num(r.alive),
    settled: Boolean(r.settled),
    conditions: { epoch: num(c.epoch), season: String(c.season), event: String(c.event) },
  };
}

export function toCitizen(r: Raw): Citizen {
  return {
    address: String(r.address).toLowerCase(),
    name: String(r.name),
    alive: Boolean(r.alive),
    score: num(r.score),
    wood: num(r.wood),
    stone: num(r.stone),
    grain: num(r.grain),
    coin: num(r.coin),
    farms: num(r.farms ?? 0),
    bond: big(r.bond),
    hunger: num(r.hunger),
    joinedEpoch: num(r.joined_epoch),
    diedEpoch: num(r.died_epoch),
    epochsSurvived: num(r.epochs_survived),
    batches: num(r.batches),
    actionsDone: num(r.actions_done),
    refused: num(r.refused),
    trades: num(r.trades),
    payout: big(r.payout),
    lawfulnessPct: r.lawfulness_pct === undefined ? null : num(r.lawfulness_pct),
  };
}

export function toChronicle(r: Raw): ChronicleEntry {
  return {
    epoch: num(r.epoch),
    kind: String(r.kind) as ChronicleKind,
    who: String(r.who),
    text: String(r.text),
    outcome: r.outcome === undefined ? null : String(r.outcome),
    delta: r.delta && typeof r.delta === "object" ? bundle(r.delta) : null,
  };
}

export function toOffer(r: Raw): Offer {
  return { id: num(r.id), from: String(r.from).toLowerCase(), to: String(r.to).toLowerCase(), give: bundle(r.give), want: bundle(r.want), epoch: num(r.epoch) };
}

export function toSnapshot(r: Raw): Snapshot {
  const list = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);
  return { world: toWorld(r.world as Raw), citizens: list(r.citizens).map(toCitizen), chronicle: list(r.chronicle).map(toChronicle), offers: list(r.offers).map(toOffer) };
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** The contract's own refusal text: base64 (tag byte + utf-8) in a dry-run error or a leader receipt. */
export function decodeRevert(payload: unknown): string | undefined {
  if (typeof payload !== "string" || payload === "") return undefined;
  try {
    const bytes = fromB64(payload);
    const text = new TextDecoder().decode(bytes.subarray(bytes[0] !== undefined && bytes[0] <= 8 ? 1 : 0));
    return /^[\x20-\x7e]{1,80}$/.test(text) ? text : undefined;
  } catch {
    return undefined;
  }
}

export const REFUSALS: Record<string, string> = {
  "season over": "The season is over: nothing more can be done in this world.",
  "bad name": "Choose a name of 1 to 40 characters.",
  "already registered": "This account is already a citizen.",
  "bond mismatch": "Attach exactly the world's bond.",
  "world full": "The world is full.",
  "not registered": "This account is not a citizen yet. Join first.",
  "not alive": "This citizen has starved and can no longer act.",
  "already acted this epoch": "You already acted this epoch. Wait for the next one.",
  "bad batch size": "Submit between 1 and 6 actions.",
  "bad action": "Each action must be 3 to 300 characters.",
  "bad judgment": "The jury returned something unusable. Nothing changed; try again.",
  "cannot trade with yourself": "You cannot trade with yourself.",
  "counterparty not alive": "That citizen is not alive, so you cannot trade with them.",
  "bad bundle": "A trade side needs whole numbers of at least 1 for wood, stone, grain or coin.",
  "you cannot afford that": "You do not hold enough to cover that.",
  "too many open offers": "You already have 3 open offers. Cancel one first.",
  "unknown offer": "That offer does not exist.",
  "offer not open": "That offer is no longer open.",
  "not your offer": "Only the right party can do that with this offer.",
  "proposer can no longer afford it": "The proposer no longer holds what they offered.",
  "epoch not over": "This epoch is not over yet.",
  "season not over": "The season has not ended yet.",
  "already settled": "This season has already been paid out.",
  "farm limit": "A citizen can own at most 2 farms.",
  "you cannot afford a farm": "A farm costs 5 wood and 3 stone.",
  "bad charter": "That charter is not acceptable.",
  "bad epoch length": "That epoch length is not acceptable.",
  "bad season length": "That season length is not acceptable.",
  "bad bond": "That bond is not acceptable.",
};

/** Refusals that depend on the clock; a dry run may see a stale time, so they never block a send. */
export const TIME_DEPENDENT = new Set(["epoch not over", "already acted this epoch", "season over"]);

export function describeError(e: unknown): string {
  const cause = (e as { cause?: { data?: { receipt?: { result?: unknown } } } })?.cause;
  const decoded = decodeRevert(cause?.data?.receipt?.result);
  if (decoded) return REFUSALS[decoded] ?? decoded;
  const msg = e instanceof Error ? e.message : String(e);
  if (/user rejected|denied|4001/i.test(msg)) return "You declined the request in your wallet.";
  return msg.length > 300 ? msg.slice(0, 300) + "…" : msg;
}

export function refusalKey(e: unknown): string | undefined {
  const cause = (e as { cause?: { data?: { receipt?: { result?: unknown } } } })?.cause;
  return decodeRevert(cause?.data?.receipt?.result);
}
