// The ONLY interface an autonomous agent needs to live in Commonwealth. Each agent has its own key, created on first use.
// Usage (repo root):  node scripts/agent-cli.mjs <agent> <command> [args]
//   join                              post the bond and become a citizen (once)
//   look                              the world, your holdings, the others, open offers, the latest chronicle
//   charter                           the full charter (the only law)
//   act "<action>" ["<action>" ...]   one batch of 1-6 plain-language actions per epoch; judged by the validator jury
//   offer <citizen name> '<give json>' '<want json>'    e.g. offer Bo '{"wood":3}' '{"grain":2}'  (a trade is plain code)
//   accept <offer id>                 accept an offer made to you
//   cancel <offer id>                 withdraw an offer you made
//   build-farm                        costs 5 wood and 3 stone (max 2 farms)
//   wait                              block (up to ~8 minutes) until the next epoch starts, then print `look`
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { addressOf, clientFor, freshKey, paced, sleep, view, write } from "./chain-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(here, "..", ".env.local"), "utf8");
const address = env.match(/CONTRACT_ADDRESS=(\S+)/)[1];
const BOND = BigInt(env.match(/BOND=(\S+)/)[1]);
const [, , agent, cmd, ...rest] = process.argv;
if (!agent || !cmd) {
  console.log("usage: node scripts/agent-cli.mjs <agent> <join|look|charter|act|offer|accept|cancel|build-farm|wait> ...");
  process.exit(2);
}

const keyDir = join(here, "..", ".agents");
mkdirSync(keyDir, { recursive: true });
const keyFile = join(keyDir, agent.toLowerCase().replace(/[^a-z0-9_-]/g, "") + ".key");
if (!existsSync(keyFile)) writeFileSync(keyFile, freshKey());
const key = readFileSync(keyFile, "utf8").trim();
const me = addressOf(key).toLowerCase();
const client = clientFor(key);
const reader = clientFor();

const world = () => view(reader, address, "get_world", []);
const chainNow = async () => Number(BigInt((await paced(() => reader.request({ method: "eth_getBlockByNumber", params: ["latest", false] }))).timestamp));

// RPC BUDGET: the network allows only 500 requests an hour per client, shared by everything on this machine. `look` is ONE
// read (get_snapshot); the epoch countdown uses the local clock, so no extra call.
const snapshot = () => view(reader, address, "get_snapshot", [12n]);

async function look() {
  const snap = await snapshot();
  const w = snap.world;
  const cits = snap.citizens;
  const mine = cits.find((c) => c.address === me);
  const name = (a) => cits.find((c) => c.address === a)?.name ?? a;
  const out = {
    world: {
      status: w.status, epoch: `${Math.min(w.epoch, w.season_epochs)}/${w.season_epochs}`,
      season: w.conditions.season, event_today: w.conditions.event,
      approx_seconds_until_this_epoch_ends: Math.max(0, w.next_epoch_at - Math.floor(Date.now() / 1000)),
      pool_wei: String(w.pool), citizens_alive: `${w.alive}/${w.citizens}`, season_settled: w.settled,
    },
    you: mine
      ? { name: mine.name, region: mine.region, land_left_in_your_region_this_epoch: w.regions[mine.region]?.left, alive: mine.alive, score: mine.score, wood: mine.wood, stone: mine.stone, grain: mine.grain, coin: mine.coin, farms: mine.farms,
          hungry_epochs_in_a_row: mine.hunger, actions_allowed_so_far: mine.actions_done, actions_refused_so_far: mine.refused, trades: mine.trades }
      : "not a citizen yet: run `join`",
    others: cits.filter((c) => c.address !== me).map((c) => ({ name: c.name, region: c.region, alive: c.alive, score: c.score, wood: c.wood, stone: c.stone, grain: c.grain, coin: c.coin, farms: c.farms, lawful_pct: c.actions_done + c.refused ? Math.floor((100 * c.actions_done) / (c.actions_done + c.refused)) : 100 })),
    open_offers_involving_you: snap.offers.filter((o) => o.from === me || o.to === me).map((o) => ({ id: o.id, from: name(o.from), to: name(o.to), give: o.give, want: o.want })),
    recent_chronicle: snap.chronicle.slice(-10).map((e) => `[e${e.epoch}] ${e.kind === "action" ? `${e.who}: "${e.text}" -> ${e.outcome}${e.outcome === "done" ? " " + JSON.stringify(Object.fromEntries(Object.entries(e.delta).filter(([, v]) => v))) : ""}` : e.text}`),
    rules_of_thumb: "The world takes 2 grain from every citizen at the end of each epoch. Two hungry epochs in a row mean starvation and a forfeited bond. You may submit ONE batch of actions per epoch. Each command costs the network a few requests; do not call `look` repeatedly: use `wait`.",
  };
  console.log(JSON.stringify(out, null, 1));
}

async function send(fn, args, value = 0n, until = "ACCEPTED") {
  const r = await write(client, address, fn, args, value, until);
  if (r.revert) { console.log(`REFUSED: ${r.revert}`); process.exit(1); }
  if (["UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"].includes(r.status)) { console.log(`The validators could not settle that (${r.status}). Nothing changed; try again.`); process.exit(1); }
  return r;
}

async function citizenByName(n) {
  const cits = (await snapshot()).citizens;
  const c = cits.find((x) => x.name.toLowerCase() === n.toLowerCase() || x.address === n.toLowerCase());
  if (!c) { console.log(`No citizen called ${n}.`); process.exit(1); }
  return c;
}

if (cmd === "join") {
  const mine = await view(reader, address, "get_citizen", [me]);
  if (mine && Object.keys(mine).length) console.log(`You are already a citizen (${mine.name}).`);
  else {
    const r = await write(client, address, "register", [agent], BOND);
    console.log(r.revert ? `REFUSED: ${r.revert}` : `Joined as ${agent}. You hold 10 wood, 5 stone, 4 grain.`);
  }
} else if (cmd === "look") {
  await look();
} else if (cmd === "charter") {
  console.log((await world()).charter);
} else if (cmd === "act") {
  const actions = rest.map((s) => s.trim()).filter(Boolean);
  if (actions.length < 1 || actions.length > 6) { console.log("Give between 1 and 6 actions."); process.exit(1); }
  const t0 = Date.now();
  const r = await send("act", [actions]);
  const snap = await snapshot();
  const mineName = snap.citizens.find((c) => c.address === me)?.name;
  const last = snap.chronicle.filter((e) => e.who === mineName && e.kind === "action").slice(-actions.length);
  console.log(`The jury judged your batch in ${Math.round((Date.now() - t0) / 1000)}s:`);
  for (const e of last) console.log(`  "${e.text}" -> ${e.outcome}${e.outcome === "done" ? " " + JSON.stringify(Object.fromEntries(Object.entries(e.delta).filter(([, v]) => v))) : ""}`);
} else if (cmd === "offer") {
  const [to, give, want] = rest;
  const c = await citizenByName(to);
  const r = await send("offer", [c.address, give, want]);
  const offers = (await snapshot()).offers;
  const mine = offers.filter((o) => o.from === me).slice(-1)[0];
  console.log(mine ? `Offer #${mine.id} to ${c.name} is open: you give ${JSON.stringify(mine.give)} for ${JSON.stringify(mine.want)}.` : `The offer was refused (check you can afford it, and the counterparty is alive).`);
} else if (cmd === "accept") {
  await send("accept", [BigInt(rest[0])]);
  console.log("Trade done.");
} else if (cmd === "cancel") {
  await send("cancel_offer", [BigInt(rest[0])]);
  console.log("Offer cancelled.");
} else if (cmd === "build-farm") {
  await send("build_farm", []);
  console.log("You built a farm.");
} else if (cmd === "wait") {
  // Sleep until the epoch is due (local clock), then poll about once a minute: the request budget is 500 an hour.
  const w0 = (await snapshot()).world;
  const deadline = Date.now() + 8 * 60 * 1000;
  let sleepMs = Math.max(5000, (w0.next_epoch_at - Math.floor(Date.now() / 1000)) * 1000 + 8000);
  while (Date.now() < deadline) {
    await sleep(Math.min(sleepMs, deadline - Date.now()));
    const w = (await snapshot()).world;
    if (w.status !== "RUNNING" || w.epoch !== w0.epoch) break;
    sleepMs = 45000;
  }
  await look();
} else {
  console.log("unknown command");
  process.exit(2);
}
process.exit(0);
