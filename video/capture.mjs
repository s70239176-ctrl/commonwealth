// Film the shots: real app routes (against the season 4 world) and typographic cards, plus a transparent caption overlay per shot.
//   cd video && node capture.mjs [shotId ...]
// Start the app first (from web/):  VITE_CONTRACT_ADDRESS=<world> npx vite --port 5199
// No transaction is sent: the /play page is only filmed, never submitted.
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { BASE, cards, css, shots } from "./storyboard.mjs";

const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync("frames", { recursive: true });
const only = new Set(process.argv.slice(2));

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, protocolTimeout: 180000, args: ["--no-first-run", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1920 / 1440 }); // 1920x1080 output
let lastLoad = 0;

async function filmPage(shot) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    // Studionet allows ~30 reads a minute and every load reads the contract: load patiently.
    await sleep(Math.max(0, 8000 - (Date.now() - lastLoad)) + (attempt > 1 ? 15000 : 0));
    await page.goto("about:blank");
    await page.goto(`${BASE}/#${shot.route}`, { waitUntil: "networkidle2", timeout: 90000 });
    lastLoad = Date.now();
    const ok = await page
      .waitForFunction((re) => new RegExp(re).test(document.body.innerText) && !/Loading|Could not reach/.test(document.body.innerText.slice(0, 400)), { timeout: 60000 }, shot.ready)
      .then(() => true)
      .catch(() => false);
    if (ok) {
      await page.addStyleTag({ content: "html{scroll-behavior:auto!important} *{caret-color:transparent}" });
      if (shot.scrollText) {
        await page.evaluate((t) => {
          const el = [...document.querySelectorAll("h1,h2,h3,dt,.section-title,.hud-label,.eyebrow,span,p")].find((e) => e.textContent.trim().startsWith(t));
          if (el) window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 140));
        }, shot.scrollText);
      }
      await page.evaluate(() => document.fonts.ready);
      await sleep(900);
      await page.screenshot({ path: `frames/${shot.id}.png` });
      return;
    }
    const seen = await page.evaluate(() => document.body.innerText.slice(0, 140).replace(/\s+/g, " ")).catch(() => "?");
    console.log(`  (attempt ${attempt}: not ready; page shows: ${seen})`);
  }
  throw new Error("never ready: " + shot.id);
}

async function filmCard(shot) {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}</style>${cards[shot.card]}`);
  await sleep(300);
  await page.screenshot({ path: `frames/${shot.id}.png` });
  await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1920 / 1440 });
}

async function filmCaption(shot) {
  if (!shot.caption) return;
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;background:transparent;width:1920px;height:1080px}
    .cap{position:absolute;left:160px;right:160px;bottom:64px;display:flex;justify-content:center}
    .cap span{background:rgba(10,18,14,.84);color:#faf8f1;font:600 40px/1.3 "Segoe UI",system-ui,sans-serif;padding:20px 34px;border-radius:18px;
      border:1px solid rgba(213,229,188,.28);text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.45);max-width:1500px}
    .cap i{display:block;width:90px;height:4px;background:#f0b75e;border-radius:4px;margin:0 auto 12px}
  </style><div class="cap"><span><i></i>${shot.caption.replace(/</g, "&lt;")}</span></div>`);
  await sleep(250);
  await page.screenshot({ path: `frames/${shot.id}.cap.png`, omitBackground: true });
  await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1920 / 1440 });
}

for (const shot of shots) {
  if (only.size && !only.has(shot.id)) continue;
  console.log("filming", shot.id);
  if (shot.kind === "page") await filmPage(shot);
  else await filmCard(shot);
  await filmCaption(shot);
}
await browser.close();
console.log("done");
