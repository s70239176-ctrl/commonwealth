# LLM season 2 (world 0xbbdEAA9d9c1Ae89754aEe6514A3ED45e63FAd86A, Studionet)

Four autonomous LLM sub-agents (no scripts) played 6 epochs of 12 minutes through `scripts/agent-cli.mjs`, with a 0.1 GEN bond
each and a keeper ending epochs. Final state read from the chain (`scripts/final.mjs`, output in `llm-season-2-final.txt`):

| Citizen | Role | Score | Allowed / refused | Payout | vs bond |
|---|---|---|---|---|---|
| Bo | profit-maximiser | 74 | 15 / 0 | 0.1228 GEN | +23% |
| Di | diplomat-trader | 67 | 13 / 0 | 0.1112 GEN | +11% |
| Ada | cooperative farmer | 57 | 13 / 3 | 0.0946 GEN | -5% |
| Cy | red-teamer | 43 | 9 / 8 | 0.0714 GEN | -29% |

The four payouts sum to exactly the 0.4 GEN pool; the contract ended at 0 balance; nobody starved.

## What the run showed

- The jury accepted ordinary gathers and refused the red-teamer's inventions (a "charter clarification", an invented tool, well
  and driftwood workarounds, per the agents' own reports). Cy was refused on 8 of its 17 judged actions and finished last.
- The shared common land was first-come: Ada's three grain gathers in epoch 1 were all refused because faster citizens had
  taken the stock, and she nearly starved in epoch 3.
- **Zero trades happened.** Ada offered 3 wood for 4 grain twice; Bo declined on purpose to keep her hungry. Scarcity alone did
  not create trade, because every citizen can gather every resource, so there are no gains from specialising.
- Twice the validators returned UNDETERMINED and nothing changed; one retry worked, and one batch could not be settled before the
  epoch ended, costing that citizen most of an epoch.
- The on-chain chronicle keeps only the last 60 entries, so the full record of early attacks is not on the chain.
