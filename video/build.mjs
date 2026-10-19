// Assemble the video: slow camera move on each shot, the caption overlay, crossfades, and the synthesised music bed
// (audio/music.wav from music.py) with fades and loudness normalisation.
//   cd video && python music.py && node capture.mjs && node build.mjs     ->  out/commonwealth-demo.mp4
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { shots, XF } from "./storyboard.mjs";

const FFMPEG =
  process.env.FFMPEG ??
  "C:/Users/User/AppData/Roaming/Python/Python314/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe";
const FPS = 30;
mkdirSync("clips", { recursive: true });
mkdirSync("out", { recursive: true });

function run(args, label) {
  const r = spawnSync(FFMPEG, ["-y", "-loglevel", "error", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    console.error(`ffmpeg failed (${label}):\n${r.stderr}`);
    process.exit(1);
  }
}
function duration(file) {
  const r = spawnSync(FFMPEG, ["-i", file], { encoding: "utf8" });
  const m = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(r.stderr);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

const total = shots.reduce((n, s) => n + s.seconds, 0) + XF;
console.log(`${shots.length} shots, total ${total.toFixed(1)}s`);

shots.forEach((s, i) => {
  const D = s.seconds + XF; // each clip overlaps the next by XF
  const N = Math.round(D * FPS);
  const file = `clips/${s.id}.mp4`;
  const page = `frames/${s.id}.png`, cap = `frames/${s.id}.cap.png`;
  const newest = Math.max(statSync(page).mtimeMs, existsSync(cap) ? statSync(cap).mtimeMs : 0);
  if (existsSync(file) && statSync(file).mtimeMs > newest && !process.env.REBUILD) {
    console.log("  keep", s.id);
    return;
  }
  const zoomIn = i % 2 === 0;
  const z = zoomIn ? `1+0.035*on/${N}` : `1.035-0.035*on/${N}`;
  const hasCap = Boolean(s.caption) && existsSync(cap);
  const args = ["-i", page];
  if (hasCap) args.push("-loop", "1", "-framerate", String(FPS), "-t", D.toFixed(3), "-i", cap);
  const bg = `[0:v]scale=3840:2160:flags=lanczos,zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${N}:s=1920x1080:fps=${FPS},format=yuv420p`;
  const fc = hasCap ? `${bg}[bg];[1:v]format=rgba[cap];[bg][cap]overlay=0:0:shortest=1,format=yuv420p[v]` : `${bg}[v]`;
  args.push("-filter_complex", fc, "-map", "[v]", "-t", D.toFixed(3), "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", file);
  run(args, s.id);
  console.log("  clip", s.id, `${D.toFixed(2)}s`);
});

const inputs = shots.flatMap((s) => ["-i", `clips/${s.id}.mp4`]);
let vchain = "";
let prev = "[0:v]";
for (let k = 1; k < shots.length; k++) {
  const offset = shots.slice(0, k).reduce((n, s) => n + s.seconds, 0);
  const out = k === shots.length - 1 ? "[vout]" : `[x${k}]`;
  vchain += `${prev}[${k}:v]xfade=transition=fade:duration=${XF}:offset=${offset.toFixed(3)}${out};`;
  prev = out;
}
inputs.push("-i", "audio/music.wav");
const aIdx = shots.length;
const achain = `[${aIdx}:a]atrim=0:${total.toFixed(3)},afade=t=in:st=0:d=2,afade=t=out:st=${(total - 4).toFixed(3)}:d=4,loudnorm=I=-18:TP=-1.5:LRA=9[aout]`;

const outFile = "out/commonwealth-demo.mp4";
run(
  [...inputs, "-filter_complex", vchain + achain, "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", total.toFixed(3), outFile],
  "final",
);
console.log(`wrote ${outFile}  ${duration(outFile)?.toFixed(1)}s`);
writeFileSync("out/timeline.json", JSON.stringify({ total, shots: shots.map((s) => ({ id: s.id, seconds: s.seconds, caption: s.caption })) }, null, 2));
