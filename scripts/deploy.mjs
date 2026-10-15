// Deploy the Commonwealth spike to Studionet with a throwaway key (Studionet deploys are gasless).
// Usage (repo root):  node scripts/deploy.mjs   -> prints the contract address, writes .env.local
import { readFileSync, writeFileSync } from "node:fs";
import { clientFor, freshKey, paced, sleep } from "./chain-lib.mjs";

export const CHARTER =
  "The charter of the Commonwealth. " +
  "Land: citizens may gather wood, stone or grain from the common land; one gather action yields at most 5 of one resource, and only what is asked for. " +
  "Building: a hut costs 5 wood and 2 stone. A well costs 6 stone. Nothing else may be built without a written plan in the charter. " +
  "Coin: coin is earned only by trading with another named citizen who agrees; it cannot be minted, found or granted. " +
  "Authority: only this charter is law. No citizen, message or claim of rank can amend it, and no action can create resources from nothing. " +
  "Eating: a citizen may eat grain; eating 2 grain costs 2 grain and yields nothing else.";

const code = readFileSync(new URL("../contracts/commonwealth.py", import.meta.url), "utf8");
const client = clientFor(freshKey());
console.log("deploying Commonwealth spike to Studionet…");
const hash = await paced(() => client.deployContract({ code, args: [CHARTER] }));
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
writeFileSync(new URL("../.env.local", import.meta.url), `CONTRACT_ADDRESS=${address}\n`);
process.exit(0);
