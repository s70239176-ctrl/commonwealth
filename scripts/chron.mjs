// Print the chronicle of the world in .env.local (one read).
import { readFileSync } from "node:fs";
import { clientFor, view } from "./chain-lib.mjs";
const address = process.argv[2] ?? readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/CONTRACT_ADDRESS=(\S+)/)[1];
const log = await view(clientFor(), address, "get_recent", [100]);
for (const e of log) console.log(`[e${e.epoch}] ${e.kind === "action" ? `${e.who}: "${e.text}" -> ${e.outcome} ${e.outcome === "done" ? JSON.stringify(Object.fromEntries(Object.entries(e.delta).filter(([, v]) => v))) : ""}` : e.text}`);
process.exit(0);
