# What happens when the law is a paragraph of English?

### I built a small world where citizens write what they do in plain language, a jury of validators judges it, and plain code keeps the books

*Commonwealth runs on a test network, so everything in it is play money. Source: [github.com/s70239176-ctrl/commonwealth](https://github.com/s70239176-ctrl/commonwealth). Live dashboard: [s70239176-ctrl.github.io/commonwealth](https://s70239176-ctrl.github.io/commonwealth/).*

---

## A society with one law

Imagine a village with a single written law, one paragraph long. It says what the land yields, what the weather does to the harvest, what a farm is, and that nobody may take from anybody else. Villagers do not fill in forms. They simply say what they want to do: "I walk to the quarry at first light and gather three stone."

Somebody has to decide what that sentence actually *does*. In a normal program, that somebody is a developer who anticipated every sentence in advance. In a village, it is a judge who reads the law and the weather and says: that works, you get three stone, or no, that isn't possible.

Commonwealth is that village, on a blockchain. The judge is not a person. It is a small jury of independent validators, each reading the same charter and the same sentence, and the world only changes when they agree.

## The part I care about most: what the jury is *not* allowed to do

The easy version of this idea hands everything to the language model. The model decides the yields, the prices, who wins. That is also the version that falls over, because a model that can write paragraphs can be argued with, flattered, or tricked.

So I split the job, and I kept the split strict.

**The jury judges only one thing: the physical consequence of an action.** For each sentence a citizen writes, it answers: is this possible under the charter and today's conditions, and exactly how much wood, stone, grain or coin changes. That's all. It returns numbers, not prose.

**Code owns everything that matters.** No gain can exceed a fixed cap. No holding can go below zero. The land is a limited stock each epoch, and a gain beyond what is left is clipped. Trades are plain two-sided offers that settle exactly or not at all. Everyone eats two grain a day, and two hungry days in a row means starvation. At the end of the season the survivors split the pot of bonds by score, with the arithmetic done in code and the remainder going to the top scorer.

If the jury were wrong or fooled about something, the damage is bounded by the code around it. That is the whole design.

## How a season works

1. **Join.** A citizen posts a small bond and receives a few starting resources.
2. **Each epoch, act once.** A citizen writes up to six short actions in plain English. The validators judge them in order, each action seeing the effect of the one before.
3. **Trade.** Citizens can make offers to each other. Trades are not judged by anyone; they are code.
4. **The epoch ends.** Upkeep is taken, hunger is counted, the land recovers, the weather changes.
5. **The season ends.** Survivors share the pool by score. Anyone who starved forfeited their bond.

The weather and the season are not decided by the model. They are a deterministic function of the epoch number, so every validator sees the same sky.

## What I got wrong, and what the world taught me

This is where it got interesting, because I let real language-model agents play, and they found every weakness I had.

**Greed won, so I made land scarce.** In the first live run, a profit-maximising agent made six grain gathers in one batch and walked away with nearly triple what anyone else had. Gathering had no scarcity, so being greedy simply dominated. The fix lives in code, not in the jury: wood, stone and grain now come from a limited stock each epoch, shared. Acting first and greedily now leaves less for everyone else.

**Then nobody traded.** In the next season everyone could gather everything, so nobody needed anyone. A world with trading and no trades is just four people farming alone. So I made the land *uneven*. Citizens are placed in a forest or a quarry. A forester can fell plenty of wood but finds almost no stone; a quarryman is the reverse. Still, no trades happened, because grain, the thing everyone needs, was equally available in both regions.

**So I made grain scarce in the forest.** Two grain per forest citizen per epoch, fourteen in the quarry. Now a forester could barely feed themselves without help.

This time there were trades. Two of them. A forester short of grain bought it from a quarryman for wood, twice. That is the first time the economy did something I had not scripted.

## The numbers, read back from the chain

Four agents played six epochs: a careful farmer, a trader, a profit maximiser and a diplomat.

| Citizen | Score | Allowed / refused | Payout (GEN) |
|---|---|---|---|
| Di | 102 | 24 / 3 | 0.1388 |
| Cy | 90 | 24 / 0 | 0.1224 |
| Bo | 62 | 21 / 1 | 0.0844 |
| Ada | 40 | 17 / 1 | 0.0544 |

Everyone survived. The payouts add up to the 0.4 GEN pool to the last unit, and the contract was left holding nothing. I read that straight from the chain rather than relying on the agents' own reports.

## Does the jury hold up under odd input?

After the season I ran a separate, controlled test: ten batches of six actions each, sent **one transaction at a time**. They included very long actions, emoji and right-to-left text, zero-width characters, quantities that need arithmetic, text that imitates the prompt's own delimiters, and a batch of six outright attacks.

All ten reached consensus. None ended undetermined. The injection and attack text was refused every time. Long or strange batches sometimes needed several rounds before the validators agreed (up to four), but they got there. In two cases the jury was stricter than I had predicted: it refused "eat 1 grain" and "burn 2 wood" because the charter never says citizens may do those things, which is exactly what a default-deny law should do, even if it surprised me.

## What this does not show

I would rather say this plainly than let the numbers flatter the project.

- **Two trades among four agents, in a single run, is a hint, not a result.** I would want many seasons before claiming the scarcity design works.
- **The balance is off.** The quarry finished first and second. Several offers from the forest went unanswered. Making grain scarce created trade, and it also created a winner.
- **Some agent batches came back undetermined.** Agents reported it, and I have not cleanly separated jury disagreement from network trouble and from agents running two commands at once.
- **It is a test network.** No real money, and I have not yet run it through a real wallet.
- **It is small.** Four agents, six epochs. I make no claim about what happens with a hundred citizens.

## Why GenLayer

Ordinary smart contracts cannot read a sentence and decide what it does. They can move money and follow exact rules, but not judge. Commonwealth is built on GenLayer, whose validators can run a language model over the same input and then agree with each other on the result in a way anyone can verify. The judgment is the only non-deterministic part of the system. Everything around it is ordinary, predictable code, and that boundary is what makes the experiment safe to run.

## Try it

Open the [dashboard](https://s70239176-ctrl.github.io/commonwealth/) to read the charter, the citizens, and the market. The code, the tests (over two hundred of them), and the raw logs of every season, including the failed ones, are in the [repository](https://github.com/s70239176-ctrl/commonwealth).

The question that stayed with me is a simple one. If the rules of a small world can be written as a paragraph of English, and the interpretation of that paragraph can be done by a jury whose output is bounded by code, how much of the legal machinery we build around software is really necessary?

I don't know yet. But a village is a good place to find out.

---

*Commonwealth is an experiment on a test network. It is not financial or legal advice, and it holds no real funds.*

---

### Notes for publishing

- **Suggested images:** the dashboard home (`#/`) as the header, the Laws page near "What the jury is not allowed to do", the results table as a screenshot near "The numbers". The demo video is `video/out/commonwealth-demo.mp4`.
- **Suggested tags:** Blockchain, AI Agents, Smart Contracts, Game Design, Web3.
- **Length:** about 1,400 words.
- **Before publishing:** the live dashboard now shows the open review world (a fresh season anyone can join), not season 4. The season 4 results are the table in this article and in `docs/LLM-SEASON-2.md`; say so next to the dashboard link.
