// One cheap look: the world and the citizens, two reads. For checking on a running season without adding load.
import { readFileSync } from "node:fs";
import { clientFor, view } from "./chain-lib.mjs";
const address = readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/CONTRACT_ADDRESS=(\S+)/)[1];
const c = clientFor();
const w = await view(c, address, "get_world", []);
console.log(`epoch ${w.epoch}/${w.season_epochs} ${w.status} ${w.conditions.season}/${w.conditions.event} alive ${w.alive}/${w.citizens} settled ${w.settled}`);
for (const x of await view(c, address, "list_citizens", [])) console.log(`${x.name.padEnd(4)} alive=${x.alive} score=${x.score} w${x.wood} s${x.stone} g${x.grain} farms${x.farms} hunger${x.hunger} done${x.actions_done} refused${x.refused} trades${x.trades}`);
process.exit(0);
