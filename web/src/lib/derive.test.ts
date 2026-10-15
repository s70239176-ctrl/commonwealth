import test from "node:test";
import assert from "node:assert/strict";
import { activityOf, actionsByEpoch, chronicleSpan, citizenTotals, commonLand, identityOf, lawfulPct, outcomeCounts, sceneMode, worldHealth } from "./derive.ts";
import type { ChronicleEntry, Citizen, World } from "./types.ts";
import { lifecycleView } from "./lifecycle.ts";

const cit = (o: Partial<Citizen>): Citizen => ({
  address: "0xabc", name: "Ada", alive: true, score: 0, wood: 0, stone: 0, grain: 0, coin: 0, farms: 0, bond: 0n, hunger: 0, joinedEpoch: 1,
  diedEpoch: 0, epochsSurvived: 0, batches: 0, actionsDone: 0, refused: 0, trades: 0, payout: 0n, lawfulnessPct: null, ...o,
});
const act = (epoch: number, who: string, outcome: string): ChronicleEntry => ({ epoch, kind: "action", who, text: "x", outcome, delta: null });
const world = (o: Partial<World>): World => ({
  charter: "c", status: "RUNNING", epoch: 2, seasonEpochs: 6, epochSeconds: 100, nextEpochAt: 0, bond: 1n, pool: 4n, citizens: 4, alive: 4, settled: false,
  conditions: { epoch: 2, season: "summer", event: "drought" }, commonsLeft: { wood: 8, stone: 6, grain: 0 }, commonsPerCitizen: { wood: 8, stone: 6, grain: 10 }, ...o,
});

test("lawfulness is the share of judged actions allowed, and 100 before anything is judged", () => {
  assert.equal(lawfulPct(cit({ actionsDone: 0, refused: 0 })), 100);
  assert.equal(lawfulPct(cit({ actionsDone: 9, refused: 8 })), 52);
  assert.equal(lawfulPct(cit({ actionsDone: 15, refused: 0 })), 100);
});

test("citizen totals sum holdings and actions; trades count once per pair", () => {
  const t = citizenTotals([cit({ wood: 3, grain: 4, farms: 1, actionsDone: 5, refused: 1, trades: 1 }), cit({ wood: 2, stone: 7, farms: 2, actionsDone: 1, trades: 1 })]);
  assert.deepEqual(t.held, { wood: 5, stone: 7, grain: 4, coin: 0 });
  assert.equal(t.farms, 3);
  assert.equal(t.actionsAllowed, 6);
  assert.equal(t.actionsRefused, 1);
  assert.equal(t.trades, 1);
});

test("common land uses the contract's own capacity: per citizen times those alive", () => {
  const land = commonLand(world({ alive: 3 }));
  assert.deepEqual(land.map((l) => [l.resource, l.left, l.capacity]), [["wood", 8, 24], ["stone", 6, 18], ["grain", 0, 30]]);
  assert.equal(commonLand(world({ alive: 0 }))[0].capacity, 8);
});

test("outcomes and per-epoch buckets only count actions", () => {
  const log: ChronicleEntry[] = [
    act(1, "Ada", "done"), act(1, "Bo", "refused"), act(2, "Ada", "land_exhausted"), act(2, "Ada", "done"),
    { epoch: 2, kind: "trade", who: "Ada", text: "traded", outcome: null, delta: null },
  ];
  assert.deepEqual(outcomeCounts(log), { done: 2, refused: 1, other: 1, total: 4 });
  assert.deepEqual(actionsByEpoch(log), [{ epoch: 1, done: 1, refused: 1, other: 0 }, { epoch: 2, done: 1, refused: 0, other: 1 }]);
  assert.deepEqual(chronicleSpan(log), { from: 1, to: 2 });
  assert.equal(chronicleSpan([]), null);
  assert.equal(activityOf(log, "Ada").length, 4);
});

test("identity is stable and uses only the name and address", () => {
  assert.deepEqual(identityOf("0xabc", "Ada Lovelace"), identityOf("0xABC", "Ada Lovelace"));
  assert.equal(identityOf("0x1", "Ada Lovelace").initials, "AL");
  assert.equal(identityOf("0x1", "bo").initials, "BO");
  assert.ok(identityOf("0x1", "x").hue >= 0 && identityOf("0x1", "x").hue < 360);
});

test("scene modes map the contract's names and fall back safely", () => {
  assert.deepEqual(sceneMode("winter", "heavy rain"), { season: "winter", event: "rain" });
  assert.deepEqual(sceneMode("spring", "bountiful harvest"), { season: "spring", event: "harvest" });
  assert.deepEqual(sceneMode("???", "unknown"), { season: "spring", event: "calm" });
});

test("world health reports only facts the contract exposes", () => {
  assert.equal(worldHealth(world({ status: "ENDED", settled: true }), []).label, "Ended");
  assert.equal(worldHealth(world({ alive: 3 }), []).label, "Strained");
  assert.equal(worldHealth(world({}), [cit({ hunger: 1 })]).detail, "1 citizen is going hungry.");
  assert.equal(worldHealth(world({}), [cit({})]).label, "Thriving");
  assert.equal(worldHealth(world({ citizens: 0, alive: 0 }), []).label, "Stable");
});

const status = (v: ReturnType<typeof lifecycleView>) => v?.steps.map((s) => s.status);

test("the action lifecycle advances only with the real transaction state", () => {
  assert.equal(lifecycleView({ kind: "idle" }), null);
  assert.deepEqual(status(lifecycleView({ kind: "running", phase: "signing" })), ["now", "todo", "todo", "todo"]);
  assert.deepEqual(status(lifecycleView({ kind: "running", phase: "pending" })), ["done", "now", "todo", "todo"]);
  assert.deepEqual(status(lifecycleView({ kind: "running", phase: "accepted" })), ["done", "done", "now", "todo"]);
  // a finished, accepted transaction is recorded but NOT final until the network says so
  assert.deepEqual(status(lifecycleView({ kind: "done", outcome: { status: "ACCEPTED" } })), ["done", "done", "done", "todo"]);
  assert.deepEqual(status(lifecycleView({ kind: "done", outcome: { status: "FINALIZED" } })), ["done", "done", "done", "done"]);
});

test("a refusal or error is shown as a failure at the step it stopped, never as progress", () => {
  const refused = lifecycleView({ kind: "done", outcome: { status: "ACCEPTED", error: "You already acted this epoch." } });
  assert.equal(refused?.error, "You already acted this epoch.");
  assert.ok(!status(refused)?.includes("now"));
  assert.equal(status(refused)?.[0], "bad");
  assert.ok(!status(refused)?.every((x) => x === "done"));
  const failed = lifecycleView({ kind: "error", message: "You declined the request in your wallet." });
  assert.equal(failed?.error, "You declined the request in your wallet.");
  assert.equal(status(failed)?.filter((x) => x === "bad").length, 1);
});
