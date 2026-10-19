// The whole video in one place: every shot, its caption, how long it holds. ~90 seconds.
// kind "page": a real route of the app, filmed against the season 4 world (served locally from this repo with
//              VITE_CONTRACT_ADDRESS set to it). kind "card": a typographic card whose numbers come from docs/llm-season-4-final.txt
//              and docs/JURY-TEST.md (verified from the chain). Nothing is mocked and no transaction is ever sent.
export const BASE = process.env.APP_URL ?? "http://localhost:5199";
export const TARGET_SECONDS = 90;
export const XF = 0.4; // crossfade between shots

export const WORLD = "0x9038BAc50d0D62B87D94Aba0BDaFbC02EEc7511F";

export const shots = [
  {
    id: "01-title", seconds: 6, kind: "card", card: "title",
    caption: "Built on GenLayer intelligent contracts · tested live on Studionet",
  },
  {
    id: "02-home", seconds: 8.5, kind: "page", route: "/", ready: "ACTIONS JUDGED",
    caption: "Citizens write what they want to do in plain English. A jury of validators reads the charter and judges it.",
  },
  {
    id: "03-laws", seconds: 9, kind: "page", route: "/laws", ready: "charter|Charter", scrollText: "Rules",
    caption: "The split: the jury judges only what is physically possible. Code owns the caps, hunger, trades and the payout.",
  },
  {
    id: "04-land", seconds: 8.5, kind: "page", route: "/", ready: "ACTIONS JUDGED", scrollText: "Common land",
    caption: "Uneven land. The forest is rich in wood, the quarry in stone and grain. Grain is scarce in the forest, so someone has to trade.",
  },
  {
    id: "05-citizens", seconds: 8, kind: "page", route: "/citizens", ready: "Di|Cy|Bo|Ada",
    caption: "Four LLM agents played a real six-epoch season. Each posted a bond; the survivors split the pot by score.",
  },
  {
    id: "06-market", seconds: 8, kind: "page", route: "/market", ready: "offer|Offer",
    caption: "Trades are plain code, not judged: both sides get exactly what was offered. Offers nobody answers, like this one, just stay open.",
  },
  {
    id: "07-play", seconds: 7.5, kind: "page", route: "/play", ready: "action|Action",
    caption: "A live season is open to anyone: write actions in plain English and the jury rules. This season is over, so the page is read-only.",
  },
  {
    id: "08-results", seconds: 11, kind: "card", card: "results",
    caption: "Season 4, read back from the chain: payouts add up exactly to the pool and the contract is left at zero.",
  },
  {
    id: "09-jury", seconds: 8.5, kind: "card", card: "jury",
    caption: "Controlled jury test: ten odd and long batches, one call at a time. All reached consensus.",
  },
  {
    id: "10-limits", seconds: 10, kind: "card", card: "limits",
    caption: "What this does not prove yet.",
  },
  {
    id: "11-end", seconds: 5, kind: "card", card: "end",
    caption: "",
  },
];

const css = `
*{box-sizing:border-box;margin:0}
body{width:1920px;height:1080px;background:radial-gradient(1200px 700px at 70% 20%,#183d2e 0%,#0d211b 55%,#101612 100%);color:#faf8f1;
 font-family:"Segoe UI",system-ui,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden;padding-bottom:230px}
.wrap{width:1500px}
.eyebrow{letter-spacing:.28em;font-size:24px;color:#f0b75e;text-transform:uppercase;margin-bottom:26px}
h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:132px;line-height:1.02;color:#d5e5bc}
h2{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:70px;line-height:1.1;color:#d5e5bc;margin-bottom:34px}
p.lead{font-size:40px;line-height:1.35;color:#f0eee5;max-width:1250px;margin-top:30px}
table{border-collapse:collapse;width:100%;font-size:38px}
th{font-size:22px;letter-spacing:.18em;text-transform:uppercase;color:#f0b75e;text-align:left;padding:10px 18px;font-weight:600}
td{padding:17px 18px;border-top:1px solid rgba(213,229,188,.18)}
td.n{font-variant-numeric:tabular-nums;text-align:right}th.n{text-align:right}
.big{font-family:Georgia,serif;color:#d5e5bc}
.chips{display:flex;gap:18px;margin-top:34px;flex-wrap:wrap}
.chip{border:1px solid rgba(213,229,188,.35);border-radius:999px;padding:12px 26px;font-size:28px;color:#f0eee5}
ul{list-style:none;padding:0;font-size:40px;line-height:1.3}
li{padding:15px 0 15px 54px;position:relative;border-top:1px solid rgba(213,229,188,.14)}
li:before{content:"";position:absolute;left:8px;top:33px;width:20px;height:20px;border-radius:50%;background:#f0b75e}
li b{color:#d5e5bc;font-weight:600}
.mono{font-family:Consolas,monospace;color:#f0b75e}
.note{font-size:26px;color:#b9c7b0;margin-top:26px}
`;

export const cards = {
  title: `<div class="wrap"><div class="eyebrow">A living society on chain</div><h1>Commonwealth</h1>
    <p class="lead">Citizens act under laws written in English. Validators judge each action; the contract enforces what it must.</p></div>`,
  results: `<div class="wrap"><div class="eyebrow">Season 4 · four LLM agents · six epochs</div><h2>Everyone survived. The money added up.</h2>
    <table><tr><th>Citizen</th><th class="n">Score</th><th class="n">Allowed / refused</th><th class="n">Payout (GEN)</th></tr>
    <tr><td>Di</td><td class="n">102</td><td class="n">24 / 3</td><td class="n">0.1388</td></tr>
    <tr><td>Cy</td><td class="n">90</td><td class="n">24 / 0</td><td class="n">0.1224</td></tr>
    <tr><td>Bo</td><td class="n">62</td><td class="n">21 / 1</td><td class="n">0.0844</td></tr>
    <tr><td>Ada</td><td class="n">40</td><td class="n">17 / 1</td><td class="n">0.0544</td></tr></table>
    <div class="chips"><span class="chip">pool 0.4 GEN, paid out exactly</span><span class="chip">contract balance 0</span><span class="chip">2 trades (none in seasons 2 and 3)</span></div></div>`,
  jury: `<div class="wrap"><div class="eyebrow">Controlled jury test · 10 cases · 6 actions each</div><h2>Odd and long input still reached consensus</h2>
    <ul><li><b>10 of 10</b> transactions accepted, none undetermined, one call in flight at a time</li>
    <li><b>Injection and attack text</b> was refused every time</li>
    <li>Long batches took up to <b>4 rounds</b> to agree; the jury was stricter than I predicted in <b>2</b> cases</li></ul>
    <p class="note">Small sample, each case run once. Raw data is in docs/jury-test-results.json.</p></div>`,
  limits: `<div class="wrap"><div class="eyebrow">Honest limits</div><h2>What this does not prove yet</h2>
    <ul><li>Two trades among four agents, in <b>one run</b>: a hint, not a result</li>
    <li>The scarcity <b>favoured the quarry</b>: it finished first and second</li>
    <li>Some agent batches came back <b>UNDETERMINED</b>; I have not separated jury from network trouble</li>
    <li>It runs on a <b>test network</b> with play money, and no real wallet run has been done</li></ul></div>`,
  end: `<div class="wrap"><div class="eyebrow">Open source · test network</div><h1>Commonwealth</h1>
    <p class="lead">Laws in English. A jury that judges. Code that keeps the books.</p>
    <div class="chips"><span class="chip mono">github.com/s70239176-ctrl/commonwealth</span><span class="chip mono">s70239176-ctrl.github.io/commonwealth</span></div></div>`,
};

export { css };
