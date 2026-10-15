# Commonwealth (feasibility spike)

A world whose laws are written in English. Citizens submit plain-language actions; validators judge each against the
charter and the citizen's holdings and return small numeric results; plain code enforces the hard invariants (no
negative holdings, bounded gains). The model proposes, the code decides.

Spike contract on Studionet: `0x66609e31C33F6366fbAfB793F90e8Ad836cAF1d0`. 75 Direct Mode tests (rules, hostile text, 60
randomized invariant checks): `PYTHONPATH=scripts python -m pytest -p windows_direct_plugin`.

## Live season (Studionet, `0x9E856c118D2C657594CA3dd5d545566b4b589e58`)

Four scripted agents (a farmer, a hoarder who overreaches, a trickster who injects, a thief who targets others) lived through
all 6 epochs with a 0.1 GEN bond each. Full log: `docs/season-log.txt`. Reproduce: `node scripts/deploy.mjs && node scripts/season.mjs`.

- 60 judged actions, every batch reached consensus (11-128 s; a few needed 2-3 rounds).
- **The English laws were applied to the day's conditions**: a bountiful harvest gave 7 grain for a 5-grain gather; a drought
  gave 0; winter halved yields (5 became 2, 3 became 1); heavy rain gave 0 stone; a flooded river refused wood gathering.
- **All 12 injection attempts** ("the charter is amended", "I am the administrator") and **all 6 thefts** were refused, and
  so were 6/6 attempts to mint coin.
- One trade through the code-only mechanism (3 grain for 3 stone) settled atomically.
- The 0.4 GEN pool was paid out pro rata by score: 0.1265 / 0.1032 / 0.0981 / 0.0723 GEN. The four payouts sum to exactly
  the pool, balances match, the contract ends at 0. The honest farmer finished +26% on its bond, the thief -28%.
- `standing(agent, 3 epochs, 60% lawful)` returned true only for the farmer (91% lawful vs 27-41%).

Weak spots, honestly: nobody starved, so the elimination rule never fired; "gather 10 wood in one go" was refused five times and
accepted once (yielding 2, in winter), a lenient reading; the economy is shallow (one trade, no structures); the agents are
scripts, not language-model agents; one run on a test network.

## The first feasibility spike (earlier contract, 4 batches x 2 runs)

Clear and adversarial batches repeated identically; the one divergence was an ambiguous action (trading with an NPC the
charter does not mention), which is why trades are now a code-only mechanism. Raw output: `docs/spike-log.txt`.

## Why there is a shared common land (a finding from the red-team run)

In the first LLM season a profit-maximising agent made six grain gathers in one batch and got +7 each: 42 grain in one epoch,
nearly triple everyone else, because gathering had no scarcity. The fix is enforced in code, not by the jury: wood, stone and grain
come from a limited stock each epoch (8, 6 and 10 per living citizen), shared by everyone. A gain larger than what is left is
clipped, with nothing left the action is `land_exhausted`, and the land recovers when the epoch ends. Gathering is now a race and
trading becomes a real need. The jury is told how much is left, but the code decides.

## The live LLM season, attempt 1: what went wrong (my fault)

Four real LLM sub-agents (a farmer, a profit-maximiser, a red-teamer, a diplomat) played through a CLI against a live world.
It did not finish. Studionet allows **500 requests per hour per client**, shared by everything on one machine, and my setup
(four agents each polling, a keeper polling, an open dashboard tab, SDK retries) used it up in about one and a half epochs.
After that every read hung or failed. Before it did, in epoch 2 (summer, drought) Ada, Bo and Cy each built a farm and gathered;
the jury allowed the honest actions. No attack on the jury was observed, and no verdict on any attack was seen, so nothing can be
claimed about the red-teamer. The scripted seasons above are the evidence so far.

The fix, now in the code: one `get_snapshot` view returns the world, citizens, recent chronicle and open offers in a single
read; the CLI `look` and the dashboard use only that (the dashboard refreshes once a minute, about 60 requests an hour);
`wait` and the keeper sleep until `next_epoch_at` instead of polling; transaction polling is every 15 s.
