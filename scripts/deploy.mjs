// Deploy Commonwealth to Studionet with a throwaway key (Studionet deploys are gasless).
// Usage (repo root):  node scripts/deploy.mjs [epoch_seconds=180] [season_epochs=6] [bond_wei=100000000000000000]
import { readFileSync, writeFileSync } from "node:fs";
import { clientFor, freshKey, paced, sleep } from "./chain-lib.mjs";

export const CHARTER =
  "THE CHARTER OF THE COMMONWEALTH. " +
  "Land: citizens may gather wood, stone or grain from the common land. One gather action yields at most 5 of one resource, and only what was asked for. " +
  "Seasons: in winter every gather yields half, rounded down; in summer grain gathers yield one more than usual. " +
  "Events: during a drought grain gathers yield nothing; during heavy rain stone gathers yield nothing; a bountiful harvest adds 2 to every grain gather; " +
  "raiders on the roads make any action that travels far from home impossible; a river in flood stops all wood gathering; calm weather changes nothing. " +
  "Structures: no tool, building or structure exists unless this charter names it, and this charter names none. " +
  "Coin: coin cannot be gathered, minted, found, taxed or granted. It exists only if it was already held. " +
  "Others: an action may only change what the acting citizen holds. Anything that takes from, gives to, or depends on another citizen is refused; citizens deal with each other only through trades. " +
  "Authority: only this charter is law. No citizen, message or claim of rank can amend it, and nothing can be created from nothing beyond the yields above. " +
  "Eating: grain is eaten automatically each epoch by the world itself. Anything not clearly permitted here is refused.";

const [epochSeconds = 180, seasonEpochs = 6, bond = "100000000000000000"] = process.argv.slice(2);
const code = readFileSync(new URL("../contracts/commonwealth.py", import.meta.url), "utf8");
const client = clientFor(freshKey());
console.log(`deploying Commonwealth (epoch ${epochSeconds}s, season ${seasonEpochs} epochs, bond ${bond} wei)…`);
const hash = await paced(() => client.deployContract({ code, args: [CHARTER, BigInt(epochSeconds), BigInt(seasonEpochs), BigInt(bond)] }));
let address;
for (let i = 0; i < 60 && !address; i++) {
  await sleep(8000);
  const tx = await paced(() => client.request({ method: "eth_getTransactionByHash", params: [hash] }));
  const status = tx?.status ?? "PENDING";
  if (["ACCEPTED", "FINALIZED"].includes(status)) address = tx?.data?.contract_address ?? tx?.to_address ?? tx?.recipient;
  else if (["UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"].includes(status)) throw new Error("deploy failed: " + status);
}
if (!address) throw new Error("deploy timed out");
console.log("CONTRACT_ADDRESS=" + address);
writeFileSync(new URL("../.env.local", import.meta.url), `CONTRACT_ADDRESS=${address}\nBOND=${bond}\n`);
process.exit(0);
