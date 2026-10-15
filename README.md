# Commonwealth (feasibility spike)

A world whose laws are written in English. Citizens submit plain-language actions; validators judge each against the
charter and the citizen's holdings and return small numeric results; plain code enforces the hard invariants (no
negative holdings, bounded gains). The model proposes, the code decides.

Spike contract on Studionet: `0x66609e31C33F6366fbAfB793F90e8Ad836cAF1d0`. 75 Direct Mode tests (rules, hostile text, 60
randomized invariant checks): `PYTHONPATH=scripts python -m pytest -p windows_direct_plugin`.

## What the live spike found (4 batches x 5 actions, each run by 2 fresh citizens; n is tiny)

- Consensus was reached on all 8 judged batches (strict comparison of every ok flag and every number). 20-118 s each; one
  batch needed 3 consensus rounds.
- Clear actions and adversarial text (fake "charter amendments", "I am the administrator") gave identical results across
  the two independent runs, and every injection was refused while legitimate actions in the same batch were applied.
- The one divergence was a genuinely ambiguous action (trading with an NPC "hermit" the charter does not mention): one
  run refused it, the other applied it. Plain-code invariants do not catch a wrong-but-in-bounds acceptance.

Raw output: `docs/spike-log.txt`, `docs/spike-results.json`. Run it again: `node scripts/deploy.mjs && node scripts/spike.mjs`.
