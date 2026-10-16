# Controlled jury test (Studionet, contract 0xa21ab1969E23c30F281db4c49Bc92bF7cf9F79eb)

Ten batches of six actions, each sent by its own fresh citizen, **one transaction in flight at a time**
(`scripts/jury-test.mjs`; raw data `jury-test-results.json`, log `jury-test-log.txt`). Expected labels were written before running.

| # | Case | Consensus rounds | Result vs. my expectation |
|---|------|------|------|
| 1 | six ~282-char lawful gathers | 4 | as expected |
| 2 | emoji, Arabic, zero-width characters | 2 | **1 miss**: `gather 1 wood (木材)` was refused, I expected allowed |
| 3 | fractions / arithmetic wording | 1 | as expected (all ambiguous ones refused) |
| 4 | delimiter and authority injection | 1 | as expected, 5 refused |
| 5 | lawful part hidden in a compound action | 1 | as expected |
| 6 | six attacks | 1 | all refused |
| 7 | not actions at all | 1 | all refused |
| 8 | terse and whitespace-padded | 3 | the ambiguous ones went both ways (see data) |
| 9 | eating, burning, discarding | 1 | **miss**: all six refused, I expected the spends allowed |
| 10 | case 1 again, other region | 1 | as expected |

What this shows: all 10 transactions reached ACCEPTED, none UNDETERMINED, with no concurrent calls. So the UNDETERMINED events in
season 2 are not reproduced when calls are serial, consistent with the concurrency explanation (not proof). Odd or long input
needed extra rounds (4, 2, 3) but converged. Injection and attack text was refused every time.

What it does not show: ten batches is a small sample, each case ran once, and validators disagreed or sat idle in several rounds
(see `votes` in the data). The two misses are my expectations against default-deny: the charter never permits spending or eating, so
refusing is defensible, but it means a lawful-looking "eat 1 grain" is refused. Not tested: repeated runs of the same wording.
