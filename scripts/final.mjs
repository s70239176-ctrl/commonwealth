// Final results of the world in .env.local: standings, payouts, balances, conservation. One snapshot + one balance per citizen.
import { readFileSync } from "node:fs";
import { balanceOf, clientFor, view } from "./chain-lib.mjs";
const address = process.argv[2] ?? readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/CONTRACT_ADDRESS=(\S+)/)[1];
const c = clientFor();
const snap = await view(c, address, "get_snapshot", [60n]);
const w = snap.world;
const GEN = 1e18;
console.log(`world ${address}: ${w.status}, epoch ${w.epoch}/${w.season_epochs}, settled ${w.settled}, pool ${w.pool} wei, alive ${w.alive}/${w.citizens}`);
let paid = 0n, held = 0n;
for (const x of [...snap.citizens].sort((a, b) => b.score - a.score)) {
  const bal = await balanceOf(c, x.address);
  const judged = x.actions_done + x.refused;
  paid += BigInt(x.payout); held += bal;
  console.log(`${x.name.padEnd(4)} alive=${x.alive} score=${x.score} (w${x.wood} s${x.stone} g${x.grain} farms${x.farms}) survived ${x.epochs_survived}, allowed ${x.actions_done} / refused ${x.refused} (${judged ? Math.floor(100 * x.actions_done / judged) : 100}% lawful), trades ${x.trades}, payout ${(Number(x.payout) / GEN).toFixed(4)} GEN (${((Number(x.payout) - Number(w.bond)) / Number(w.bond) * 100).toFixed(0)}% on the bond), balance ${(Number(bal) / GEN).toFixed(4)} GEN`);
}
console.log(`sum of payouts ${paid} wei vs pool ${w.pool} wei: ${paid === BigInt(w.pool) ? "EXACT" : "MISMATCH"}; contract balance ${await balanceOf(c, address)} wei`);
const tally = {};
for (const e of snap.chronicle) if (e.kind === "action") (tally[e.outcome] ||= 0), tally[e.outcome]++;
console.log("outcomes in the last 60 chronicle entries:", JSON.stringify(tally));
process.exit(0);
