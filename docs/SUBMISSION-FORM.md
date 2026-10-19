# Submission form: ready to paste

Character counts are checked against the form's limits (180 / 1000 / 500).

## 01 Project

**Project name:** Commonwealth

**Primary tag:** Gaming

**Tag 1 / Tag 2:** pick the closest two topics the form offers inside Gaming. Best fits: *simulation* (or *virtual worlds*) and *agent economies* (or *multi-agent*). If you would rather lead with the agents, **AI & Agents** is the honest second choice: the demo is four LLM agents playing a season.

## 02 Project summary

**One-liner (175/180):**

> A small society whose only law is a paragraph of English: citizens write what they do, a validator jury judges the physical outcome, and code owns the caps, trades and payout.

## 03 Project overview

**Description (990/1000):**

> Commonwealth is a small world governed by one written charter. Citizens post a bond, then each epoch write up to six plain-English actions. GenLayer validators each read the charter, the weather and the citizen's holdings and return only the physical consequence as numbers; they agree only if every number matches. Everything that matters is plain code: a gain cap, no negative holdings, a limited common land per region (forest is wood-rich, quarry is stone- and grain-rich), code-settled trades, hunger and starvation, and a pro-rata payout of the bonds to survivors. Injection and attack text is refused. Verified live on Studionet: four LLM agents played a six-epoch season, all survived, payouts summed exactly to the pool with the contract left at 0, and two trades happened once grain was made scarce in the forest. A 10-batch odd-and-long-input jury test all reached consensus. Honest limits: two trades in one run is a hint, some batches came back undetermined, test network only.

## 04 Demo video

**Demo URL (optional):** upload `video/out/commonwealth-demo.mp4` (1:30, captions and a music bed, no narration) to YouTube or X, then paste the direct post link. It is not uploaded yet, so leave this blank until it is.

## 05 How-to (the exact path)

Each item is one step: heading (optional) then instruction. These use the open review world (7-day epochs, 0.01 GEN bond, test network only).

1. **Open the app.** Go to https://s70239176-ctrl.github.io/commonwealth/ . The top bar shows the Genlayer Studio Network and the World page shows *Epoch 1 of 8*. Click **Laws** to read the charter: it is the only law.
2. **Sign in.** Click **Play**, then **Use demo account**. This creates a throwaway key in your browser. No wallet is needed.
3. **Join.** Type any name (for example "Ada") and click **Post the bond and join**. Wait for "You are a citizen." (about 30 seconds). The bond is 0.01 GEN of test money.
4. **Write a batch.** In *Propose an action*, replace the example with two or three lines in plain English, one lawful and one not:
   `Gather 4 wood from the common land.`
   `Take 5 grain from another citizen's store.`
5. **Submit to the jury.** Click **Submit to the jury**. The validators each judge the batch independently. Allow up to about three minutes.
6. **Read the result.** Open **Citizens**, then your citizen. *Your recent actions* on the Play page lists each action as allowed or refused, and your holdings show what actually moved.
7. **Try to act again.** Submit another batch in the same epoch. It is refused with "already acted this epoch" (one batch per epoch).

## 06 Review verification

**Expected verification outcome (460/500):**

> Within about 3 minutes the batch is accepted. The lawful gather shows "done" and adds up to the amount asked (halved in winter, clipped to the land left in your region; forest wood is 12 per citizen, quarry wood only 2). The line taking from another citizen shows "refused" and changes nothing. No single action can add more than 10. A second batch in the same epoch fails with "already acted this epoch". The jury is a model, so a borderline wording can vary.

**Contract link 1:** https://explorer-studio.genlayer.com/address/0x80b64d040BB30493c1F25a4aB6630f84546F64c5

(The open review world, where the how-to path runs.)

**Contract link 2:** https://explorer-studio.genlayer.com/address/0x9038BAc50d0D62B87D94Aba0BDaFbC02EEc7511F

(Season 4: four LLM agents, six epochs, settled. Payouts add up exactly to the 0.4 GEN pool and the contract was left at 0. Results: `docs/LLM-SEASON-2.md`.)

## 07 Project links

**Website (required):** https://s70239176-ctrl.github.io/commonwealth/

**GitHub:** https://github.com/s70239176-ctrl/commonwealth

---

### Notes for you (not for the form)

- **Not clicked through end to end.** The steps are written from the app's own screens and code. I confirmed the review world deploys and reads back as running (epoch 1 of 8), and the same contract code ran season 4. I did **not** drive this exact UI path against the new world, because that would spend a real test-network transaction. Do a quick run-through yourself, or tell me to.
- **The hosted dashboard now shows the review world**, which is empty until someone joins, not the season 4 results. The season 4 results are in the repo, the article and the video.
- **The first citizen to join lives in the forest** (wood-rich). A quarry citizen asking for 4 wood would be clipped to the 2 the quarry holds, so the lawful action may show a smaller gain. That is the land rule working, not a bug.
- **Honesty line for stewards:** two trades among four agents in one run is a hint, not proof; some batches came back UNDETERMINED; it runs on a test network and has not been tried through a real wallet.
