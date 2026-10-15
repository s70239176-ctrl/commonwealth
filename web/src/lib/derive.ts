/**
 * Everything the screens show that is DERIVED from real contract data lives here, as pure functions, so it can be tested and
 * so nothing on screen is invented. If the data to compute something does not exist, these return null or empty results and
 * the screen shows an honest empty state.
 */
import type { ChronicleEntry, Citizen, Offer, Resource, World } from "./types.ts";
import { RESOURCES } from "./types.ts";

export const LAND_RESOURCES: Resource[] = ["wood", "stone", "grain"];

/** Share of judged actions the world allowed. 100 when nothing has been judged yet (matches the contract's own rule). */
export function lawfulPct(c: Pick<Citizen, "actionsDone" | "refused">): number {
  const judged = c.actionsDone + c.refused;
  return judged === 0 ? 100 : Math.floor((100 * c.actionsDone) / judged);
}

export interface CitizenTotals {
  held: Record<Resource, number>;
  farms: number;
  actionsAllowed: number;
  actionsRefused: number;
  trades: number;
}

/** Sums across citizens. Trades are counted per participant, so the number of completed trades is half the sum. */
export function citizenTotals(citizens: Citizen[]): CitizenTotals {
  const held: Record<Resource, number> = { wood: 0, stone: 0, grain: 0, coin: 0 };
  let farms = 0;
  let actionsAllowed = 0;
  let actionsRefused = 0;
  let participations = 0;
  for (const c of citizens) {
    for (const r of RESOURCES) held[r] += c[r];
    farms += c.farms;
    actionsAllowed += c.actionsDone;
    actionsRefused += c.refused;
    participations += c.trades;
  }
  return { held, farms, actionsAllowed, actionsRefused, trades: Math.floor(participations / 2) };
}

export interface CommonLand {
  resource: Resource;
  left: number;
  capacity: number;
}

/** The common land is the one resource pool whose denominator the contract really exposes. */
export function commonLand(w: World): CommonLand[] {
  return LAND_RESOURCES.map((resource) => ({
    resource,
    left: w.commonsLeft[resource] ?? 0,
    capacity: (w.commonsPerCitizen[resource] ?? 0) * Math.max(1, w.alive),
  }));
}

export interface OutcomeCounts {
  done: number;
  refused: number;
  other: number;
  total: number;
}

export function outcomeCounts(entries: ChronicleEntry[]): OutcomeCounts {
  let done = 0;
  let refused = 0;
  let other = 0;
  for (const e of entries) {
    if (e.kind !== "action") continue;
    if (e.outcome === "done") done++;
    else if (e.outcome === "refused") refused++;
    else other++;
  }
  return { done, refused, other, total: done + refused + other };
}

export interface EpochBucket {
  epoch: number;
  done: number;
  refused: number;
  other: number;
}

/** Judged actions per epoch, from the retained chronicle only (the contract keeps the most recent 60 entries). */
export function actionsByEpoch(entries: ChronicleEntry[]): EpochBucket[] {
  const map = new Map<number, EpochBucket>();
  for (const e of entries) {
    if (e.kind !== "action") continue;
    const b = map.get(e.epoch) ?? { epoch: e.epoch, done: 0, refused: 0, other: 0 };
    if (e.outcome === "done") b.done++;
    else if (e.outcome === "refused") b.refused++;
    else b.other++;
    map.set(e.epoch, b);
  }
  return [...map.values()].sort((a, b) => a.epoch - b.epoch);
}

export function activityOf(entries: ChronicleEntry[], name: string): ChronicleEntry[] {
  return entries.filter((e) => e.who === name);
}

/** The oldest and newest epoch still present in the retained chronicle, or null when it is empty. */
export function chronicleSpan(entries: ChronicleEntry[]): { from: number; to: number } | null {
  if (entries.length === 0) return null;
  return { from: Math.min(...entries.map((e) => e.epoch)), to: Math.max(...entries.map((e) => e.epoch)) };
}

export function offersOf(offers: Offer[], address: string): Offer[] {
  return offers.filter((o) => o.from === address || o.to === address);
}

/** A stable identity treatment for a citizen: hue and initials come only from the name and address. */
export function identityOf(address: string, name: string): { hue: number; initials: string } {
  let h = 0;
  for (const ch of address.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
  return { hue: h, initials };
}

export type SceneSeason = "spring" | "summer" | "autumn" | "winter";
export type SceneEvent = "calm" | "drought" | "rain" | "harvest" | "raiders" | "flood";

/** Map the contract's own season and event names onto the scene's drawing modes. Unknown values fall back to neutral. */
export function sceneMode(season: string, event: string): { season: SceneSeason; event: SceneEvent } {
  const s = (["spring", "summer", "autumn", "winter"] as const).find((x) => x === season) ?? "spring";
  const e: SceneEvent =
    event === "drought" ? "drought"
    : event === "heavy rain" ? "rain"
    : event === "bountiful harvest" ? "harvest"
    : event === "raiders on the roads" ? "raiders"
    : event === "river in flood" ? "flood"
    : "calm";
  return { season: s, event: e };
}

export type Health = { label: "Thriving" | "Stable" | "Strained" | "Ended"; tone: "ok" | "warn" | "bad" | "muted"; detail: string };

/**
 * A plain, explainable reading of the world, not a score: it only reports how many citizens are alive and whether any are
 * hungry, both facts the contract exposes.
 */
export function worldHealth(w: World, citizens: Citizen[]): Health {
  if (w.status === "ENDED") return { label: "Ended", tone: "muted", detail: w.settled ? "The season is over and paid out." : "The season is over; payout pending." };
  const hungry = citizens.filter((c) => c.alive && c.hunger > 0).length;
  if (w.alive < w.citizens) return { label: "Strained", tone: "bad", detail: `${w.citizens - w.alive} of ${w.citizens} citizens have starved.` };
  if (hungry > 0) return { label: "Strained", tone: "warn", detail: `${hungry} citizen${hungry > 1 ? "s are" : " is"} going hungry.` };
  return { label: w.citizens === 0 ? "Stable" : "Thriving", tone: "ok", detail: w.citizens === 0 ? "No citizens yet." : "Every citizen is alive and fed." };
}
