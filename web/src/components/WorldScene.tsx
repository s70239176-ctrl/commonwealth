import { useId, useMemo } from "react";
import { sceneMode, type SceneSeason } from "../lib/derive.ts";

/**
 * The civilization, drawn. A procedural SVG illustration (no raster assets, no network): terraced fields, a river, a village with a
 * columned hall, forests and mountains. It is an atmospheric world view, NOT a geographic map: nothing on it is a real location.
 * What it does carry is real: the season sets the palette and the day's event sets the weather (rain, drought haze, flooded river,
 * harvest gold, snow), both read from the contract.
 */

interface Palette {
  skyTop: string; skyBottom: string; sun: string; far: string; mid: string; near: string;
  field: [string, string, string]; tree: string; river: string; roof: string; wall: string;
}

const PALETTES: Record<SceneSeason, Palette> = {
  spring: { skyTop: "#9cc6c8", skyBottom: "#f3e6c5", sun: "#fff1c4", far: "#7a9a94", mid: "#4f7d5f", near: "#2f5e43", field: ["#7fae5a", "#9bc16a", "#6a9b4f"], tree: "#2d6a45", river: "#7fb8c4", roof: "#b5562f", wall: "#ecdfc3" },
  summer: { skyTop: "#76b2c9", skyBottom: "#f7e3ad", sun: "#fff3c0", far: "#6f948c", mid: "#4a7c4f", near: "#2a5a3a", field: ["#8fb34a", "#c3b94a", "#6f9a45"], tree: "#2a6a3c", river: "#6fb1c2", roof: "#b04a28", wall: "#efe2c4" },
  autumn: { skyTop: "#d9a78a", skyBottom: "#f5d9a3", sun: "#ffe0a0", far: "#8a7f7a", mid: "#8c7340", near: "#5b4a2b", field: ["#c99a3c", "#b5762f", "#d7b25a"], tree: "#a85a28", river: "#8aa9ad", roof: "#9c3f24", wall: "#ebd9b8" },
  winter: { skyTop: "#9fb4c4", skyBottom: "#e8edf0", sun: "#f4f1e6", far: "#8e9fae", mid: "#a9b8bd", near: "#6d7f80", field: ["#dfe6e6", "#cfd9d9", "#e9eeee"], tree: "#3c5a50", river: "#9fc1cf", roof: "#8a4a38", wall: "#e7e2d4" },
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("")}`;
}

export function WorldScene({ season, event, className, label }: { season: string; event: string; className?: string; label?: string }) {
  const mode = sceneMode(season, event);
  const p = PALETTES[mode.season];
  const uid = useId().replace(/:/g, "");
  const dry = mode.event === "drought";
  const rain = mode.event === "rain";
  const flood = mode.event === "flood";
  const harvest = mode.event === "harvest";
  const raiders = mode.event === "raiders";

  const scene = useMemo(() => {
    const r = rng(7);
    const fields: { pts: string; fill: string }[] = [];
    // terraced fields climbing the valley floor, in rows that narrow toward the horizon
    for (let row = 0; row < 7; row++) {
      const y = 430 + row * 34;
      const h = 22 + row * 6;
      const cols = 14 - row;
      for (let c = 0; c < cols; c++) {
        const w = 110 + row * 14;
        const x = -60 + c * (w + 6) + (row % 2) * 40;
        const lean = 26 - row * 2;
        const fill = p.field[Math.floor(r() * 3)];
        fields.push({ pts: `${x},${y + h} ${x + lean},${y} ${x + lean + w},${y} ${x + w},${y + h}`, fill });
      }
    }
    const houses: { x: number; y: number; s: number; roof: string }[] = [];
    for (let i = 0; i < 16; i++) {
      const ang = r() * Math.PI * 2;
      const rad = 30 + r() * 110;
      houses.push({ x: 760 + Math.cos(ang) * rad * 1.7, y: 372 + Math.sin(ang) * rad * 0.34, s: 0.7 + r() * 0.7, roof: r() > 0.5 ? p.roof : shade(p.roof, -26) });
    }
    houses.sort((a, b) => a.y - b.y);
    const trees: { x: number; y: number; s: number }[] = [];
    for (let i = 0; i < 70; i++) trees.push({ x: r() * 1600, y: 330 + r() * 230, s: 0.6 + r() * 1.1 });
    trees.sort((a, b) => a.y - b.y);
    const pines: number[] = [];
    for (let i = 0; i < 26; i++) pines.push(-20 + i * 64 + r() * 30);
    const drops: { x: number; y: number }[] = [];
    for (let i = 0; i < 90; i++) drops.push({ x: r() * 1700, y: r() * 640 });
    return { fields, houses, trees, pines, drops };
  }, [p]);

  const haze = dry ? "#e3b568" : raiders ? "#26231f" : rain ? "#5b6f7a" : flood ? "#6a8b96" : "transparent";
  const hazeOpacity = dry ? 0.34 : raiders ? 0.28 : rain ? 0.38 : flood ? 0.18 : 0;

  return (
    <svg className={className} viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label ?? `Illustration of the Commonwealth in ${mode.season}`}>
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.skyTop} /><stop offset="0.65" stopColor={p.skyBottom} /></linearGradient>
        <radialGradient id={`sun${uid}`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={p.sun} stopOpacity="1" /><stop offset="1" stopColor={p.sun} stopOpacity="0" /></radialGradient>
        <linearGradient id={`fade${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0D211B" stopOpacity="0" /><stop offset="1" stopColor="#0D211B" stopOpacity="0.78" /></linearGradient>
      </defs>
      <rect width="1600" height="640" fill={`url(#sky${uid})`} />
      <circle cx="1180" cy="170" r={dry ? 190 : 150} fill={`url(#sun${uid})`} opacity={rain ? 0.25 : 0.9} />
      {/* far mountains */}
      <path d="M0 330 L120 250 L210 300 L340 190 L470 300 L560 240 L700 320 L820 230 L960 310 L1090 200 L1230 300 L1340 240 L1480 310 L1600 250 V420 H0Z" fill={p.far} opacity="0.85" />
      {mode.season === "winter" ? <path d="M340 190 L300 232 L340 222 L372 240Z M1090 200 L1052 240 L1092 230 L1126 246Z M820 230 L790 262 L822 254 L848 266Z" fill="#f4f6f6" opacity="0.9" /> : null}
      {/* hills */}
      <path d="M0 380 C200 330 360 350 520 372 C700 396 860 340 1040 356 C1240 374 1400 336 1600 360 V470 H0Z" fill={p.mid} />
      <path d="M0 430 C220 398 420 420 620 430 C860 442 1080 400 1300 420 C1440 432 1540 420 1600 412 V560 H0Z" fill={p.near} opacity="0.9" />
      {/* terraced fields */}
      <g opacity={dry ? 0.82 : 1}>
        {scene.fields.map((f, i) => (
          <polygon key={i} points={f.pts} fill={dry ? shade(f.fill, 14) : harvest ? shade(f.fill, 22) : f.fill} stroke="#00000022" strokeWidth="1" />
        ))}
      </g>
      {harvest ? <rect y="430" width="1600" height="210" fill="#f0b75e" opacity="0.14" /> : null}
      {/* river winding through the valley */}
      <path d="M1010 340 C960 380 1040 410 940 450 C840 490 960 520 820 560 C720 596 800 620 700 650" fill="none" stroke={p.river} strokeWidth={flood ? 46 : 22} strokeLinecap="round" opacity="0.95" />
      <path d="M1010 340 C960 380 1040 410 940 450 C840 490 960 520 820 560 C720 596 800 620 700 650" fill="none" stroke="#ffffff" strokeWidth={flood ? 12 : 5} strokeLinecap="round" opacity="0.28" />
      {flood ? <path d="M560 590 C760 560 980 575 1180 600 V640 H560Z" fill={p.river} opacity="0.45" /> : null}
      {/* road */}
      <path d="M-20 520 C260 470 520 450 740 392 C980 330 1240 350 1620 300" fill="none" stroke="#e8d9b0" strokeWidth="9" strokeLinecap="round" opacity="0.55" />
      {/* village */}
      <g>
        {scene.houses.map((h, i) => (
          <g key={i} transform={`translate(${h.x} ${h.y}) scale(${h.s})`}>
            <rect x="-14" y="-12" width="28" height="18" fill={p.wall} />
            <polygon points="-18,-12 0,-30 18,-12" fill={h.roof} />
            <rect x="-4" y="-2" width="8" height="8" fill="#5b3a22" opacity="0.7" />
          </g>
        ))}
        {/* the hall, with its columns */}
        <g transform="translate(760 360)">
          <polygon points="-62,-30 0,-74 62,-30" fill={shade(p.roof, -10)} />
          <rect x="-56" y="-30" width="112" height="9" fill={p.wall} />
          {[-44, -22, 0, 22, 44].map((x) => <rect key={x} x={x - 4} y="-21" width="8" height="40" fill="#f6efe0" />)}
          <rect x="-66" y="19" width="132" height="8" fill={p.wall} />
          <rect x="-72" y="27" width="144" height="7" fill={shade(p.wall, -22)} />
        </g>
      </g>
      {/* trees */}
      <g>
        {scene.trees.map((t, i) => (
          <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
            <rect x="-2" y="0" width="4" height="12" fill="#4a3322" />
            <circle cx="0" cy="-4" r="13" fill={p.tree} />
            <circle cx="-7" cy="2" r="9" fill={shade(p.tree, -16)} />
          </g>
        ))}
      </g>
      {raiders ? (
        <g fill="#1d1a16" opacity="0.8">
          {[[310, 478], [364, 468], [412, 460], [1250, 340], [1302, 334]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}><circle cy="-9" r="4" /><rect x="-3" y="-5" width="6" height="14" /></g>)}
        </g>
      ) : null}
      {/* foreground forest silhouettes */}
      <g fill="#0F2A20">
        {scene.pines.map((x, i) => (
          <polygon key={i} points={`${x},640 ${x + 28},${560 - (i % 4) * 14} ${x + 56},640`} />
        ))}
      </g>
      {/* weather */}
      <rect width="1600" height="640" fill={haze} opacity={hazeOpacity} />
      {rain ? (
        <g stroke="#dfeaf0" strokeWidth="1.400" opacity="0.5">
          {scene.drops.map((d, i) => <line key={i} x1={d.x} y1={d.y} x2={d.x - 10} y2={d.y + 26} />)}
        </g>
      ) : null}
      {mode.season === "winter" && !rain ? (
        <g fill="#ffffff" opacity="0.7">
          {scene.drops.slice(0, 60).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.500 + (i % 3) * 0.700} />)}
        </g>
      ) : null}
      <rect width="1600" height="640" fill={`url(#fade${uid})`} />
    </svg>
  );
}
