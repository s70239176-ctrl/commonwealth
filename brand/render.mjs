// Render the logo SVGs to PNG with headless Edge:  cd video && node ../brand/render.mjs
import { readFileSync } from "node:fs";
import puppeteer from "../video/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const jobs = [
  ["logo-mark.svg", "logo-mark-1024.png", 1024, 1024],
  ["logo-mark.svg", "logo-mark-256.png", 256, 256],
  ["logo-lockup.svg", "logo-lockup-2800.png", 2800, 600],
];
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
for (const [src, out, w, h] of jobs) {
  const svg = readFileSync(new URL(src, import.meta.url), "utf8").replace(/ width="\d+" height="\d+"/, ` width="${w}" height="${h}"`);
  await page.setViewport({ width: w, height: h });
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
  await page.screenshot({ path: new URL(out, import.meta.url).pathname.replace(/^\//, ""), omitBackground: true });
  console.log("wrote", out);
}
await browser.close();
