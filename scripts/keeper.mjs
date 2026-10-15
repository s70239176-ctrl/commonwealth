// The epoch keeper: anyone may end an epoch once its time is up and pay out the season once it is over. This process does
// only that. It has no say in what happens: the contract decides everything.
// Usage (repo root):  node scripts/keeper.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { balanceOf, clientFor, freshKey, paced, sleep, view, write } from "./chain-lib.mjs";

const address = readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/CONTRACT_ADDRESS=(\S+)/)[1];
const client = clientFor(freshKey());
const reader = clientFor();
const log = [];
const say = (m) => { const line = `[${new Date().toISOString().slice(11, 19)}] ${m}`; console.log(line); log.push(line); };
const chainNow = async () => Number(BigInt((await paced(() => reader.request({ method: "eth_getBlockByNumber", params: ["latest", false] }))).timestamp));

say(`keeper watching ${address} (budget-aware: it sleeps until each epoch is due)`);
const tNow = async () => Number(BigInt((await paced(() => reader.request({ method: "eth_getBlockByNumber", params: ["latest", false] }))).timestamp));
for (;;) {
  const w = (await view(reader, address, "get_snapshot", [0n])).world;
  if (w.status === "RUNNING") {
    const wait = w.next_epoch_at - (await tNow());
    if (wait <= 0) {
      const r = await write(client, address, "end_epoch", []);
      say(`end_epoch (epoch ${w.epoch}): ${r.revert ?? r.status}`);
      await sleep(20000);
    } else {
      await sleep(Math.min(wait + 3, 150) * 1000);
    }
  } else if (!w.settled) {
    const r = await write(client, address, "settle_season", []);
    say(`settle_season: ${r.revert ?? r.status}`);
    await sleep(20000);
  } else {
    break;
  }
}
say("season settled; waiting for payouts to finalize…");
await sleep(100000);
const snapEnd = await view(reader, address, "get_snapshot", [5n]);
for (const c of snapEnd.citizens) {
  const lawful = c.actions_done + c.refused ? Math.floor((100 * c.actions_done) / (c.actions_done + c.refused)) : 100;
  const rec = { epochs_survived: c.epochs_survived, lawfulness_pct: lawful, actions_done: c.actions_done, refused: c.refused, trades: c.trades };
  say(`${c.name.padEnd(8)} alive=${c.alive} score=${c.score} survived ${rec.epochs_survived} epochs, lawful ${rec.lawfulness_pct}% (${rec.actions_done} done / ${rec.refused} refused), trades ${rec.trades}, farms ${c.farms}, payout ${c.payout} wei, balance ${await balanceOf(reader, c.address)}`);
}
say("chronicle tail: " + snapEnd.chronicle.slice(-5).map((e) => e.text).join(" | "));
writeFileSync(new URL("../docs/llm-season-keeper.log", import.meta.url), log.join("\n") + "\n");
process.exit(0);
