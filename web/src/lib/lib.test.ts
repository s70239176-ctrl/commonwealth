import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REFUSALS, decodeRevert, describeError, toChronicle, toCitizen, toOffer, toWorld } from "./decode.ts";
import { formatGen, parseGen } from "./format.ts";

test("every refusal the contract can raise has a plain-language message", () => {
  const src = readFileSync(new URL("../../../contracts/commonwealth.py", import.meta.url), "utf8");
  const keys = new Set([...src.matchAll(/_fail\("([^"]+)"\)/g)].map((m) => m[1]));
  const missing = [...keys].filter((k) => !(k in REFUSALS));
  assert.deepEqual(missing, []);
});

test("the world decodes, keeping wei exact", () => {
  const w = toWorld({
    charter: "c", status: "RUNNING", epoch: 3n, season_epochs: 6n, epoch_seconds: 180n, next_epoch_at: 99n, bond: 100000000000000000n,
    pool: 400000000000000000n, citizens: 4n, alive: 3n, settled: false, conditions: { epoch: 3n, season: "autumn", event: "river in flood" },
    commons_left: { wood: 8n, stone: 6n, grain: 0n }, commons_per_citizen: { wood: 8n, stone: 6n, grain: 10n },
  });
  assert.equal(w.pool, 400000000000000000n);
  assert.equal(w.conditions.event, "river in flood");
  assert.equal(w.epoch, 3);
  assert.equal(w.commonsLeft.grain, 0);
  assert.equal(w.commonsPerCitizen.grain, 10);
});

test("a citizen record decodes, with lawfulness only on the record view", () => {
  const base = {
    address: "0xABC", name: "Ada", alive: true, score: 37n, wood: 13n, stone: 8n, grain: 10n, coin: 0n, farms: 1n, bond: 100000000000000000n,
    hunger: 0n, joined_epoch: 1n, died_epoch: 0n, epochs_survived: 2n, batches: 2n, actions_done: 5n, refused: 1n, trades: 1n, payout: 0n,
  };
  assert.equal(toCitizen(base).lawfulnessPct, null);
  const rec = toCitizen({ ...base, lawfulness_pct: 83n });
  assert.equal(rec.lawfulnessPct, 83);
  assert.equal(rec.address, "0xabc");
  assert.equal(rec.farms, 1);
});

test("chronicle entries and offers decode", () => {
  const act = toChronicle({ epoch: 2n, kind: "action", who: "Bo", text: "Gather stone", outcome: "done", delta: { wood: 0n, stone: 5n, grain: 0n, coin: 0n } });
  assert.equal(act.outcome, "done");
  assert.equal(act.delta?.stone, 5);
  const ev = toChronicle({ epoch: 2n, kind: "epoch", who: "world", text: "epoch 2 ended" });
  assert.equal(ev.outcome, null);
  assert.equal(ev.delta, null);
  const o = toOffer({ id: 1n, from: "0xAA", to: "0xBB", give: { stone: 6n }, want: { grain: 4n }, epoch: 2n });
  assert.deepEqual(o.give, { stone: 6 });
  assert.equal(o.to, "0xbb");
});

test("revert payloads decode to the contract's own words", () => {
  const b64 = (s: string) => Buffer.from(Uint8Array.from([1, ...new TextEncoder().encode(s)])).toString("base64");
  assert.equal(decodeRevert(b64("already acted this epoch")), "already acted this epoch");
  assert.equal(describeError({ cause: { data: { receipt: { result: b64("farm limit") } } } }), REFUSALS["farm limit"]);
  assert.equal(describeError(new Error("user rejected the request")), "You declined the request in your wallet.");
});

test("GEN amounts round-trip exactly", () => {
  assert.equal(parseGen("0.1"), 100000000000000000n);
  assert.equal(formatGen(126451612903225807n), "0.1264");
});
