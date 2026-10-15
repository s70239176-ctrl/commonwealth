import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "world" | "play" | "agents" | "citizens" | "laws" | "market" | "grain" | "wood" | "stone" | "coin" | "farm" | "check"
  | "clock" | "cross" | "copy" | "link" | "trade" | "skull" | "scroll" | "shield" | "sun" | "cloud" | "rain" | "leaf" | "alert"
  | "user" | "arrow" | "gate" | "spark" | "wallet" | "menu" | "home";

const paths: Record<IconName, ReactNode> = {
  world: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h5v-6h4v6h5V10" /></>,
  play: <><path d="M5 4l14 8-14 8z" /></>,
  agents: <><rect x="5" y="8" width="14" height="10" rx="2" /><path d="M12 4v4M9 13h.01M15 13h.01M9 21h6" /></>,
  citizens: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 3-6 6-6s6 2 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14c3 0 5 1.8 5 5" /></>,
  laws: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h7" /></>,
  market: <><path d="M4 9l2-5h12l2 5" /><path d="M4 9a3 3 0 006 0 3 3 0 006 0 3 3 0 004 0" /><path d="M5 12v8h14v-8" /></>,
  grain: <><path d="M12 21V8" /><path d="M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zM12 8c3 0 4-2 4-4-3 0-4 2-4 4zM12 13c-3 0-4-2-4-4 3 0 4 2 4 4zM12 13c3 0 4-2 4-4-3 0-4 2-4 4zM12 18c-3 0-4-2-4-4 3 0 4 2 4 4zM12 18c3 0 4-2 4-4-3 0-4 2-4 4z" /></>,
  wood: <><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M9 7.5c0-.5 1-1 3-1" /></>,
  stone: <><path d="M4 17l3-8 5-4 6 3 2 7-4 4H8z" /><path d="M7 9l5 3 6-2M12 12v9" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5c.4-1 1.4-1.5 2.5-1.5 1.4 0 2.5.7 2.5 1.8 0 2.4-5 1.2-5 3.6 0 1.100 1.1 1.800 2.500 1.800 1.100 0 2.100-.5 2.500-1.500" /></>,
  farm: <><path d="M3 20h18" /><path d="M5 20V10l7-5 7 5v10" /><path d="M10 20v-5h4v5" /></>,
  check: <><path d="M5 12.5l4.500 4.500L19 7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  cross: <><path d="M6 6l12 12M18 6L6 18" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></>,
  link: <><path d="M10 14a4 4 0 005.700 0l3-3a4 4 0 00-5.700-5.700l-1 1" /><path d="M14 10a4 4 0 00-5.700 0l-3 3a4 4 0 005.700 5.700l1-1" /></>,
  trade: <><path d="M4 8h14l-3-3M20 16H6l3 3" /></>,
  skull: <><path d="M12 3a8 8 0 00-5 14.200V20h10v-2.800A8 8 0 0012 3z" /><path d="M9 12h.01M15 12h.01M10 20v-2M14 20v-2" /></>,
  scroll: <><path d="M8 4h11v13a3 3 0 01-3 3H6a3 3 0 003-3V6a2 2 0 00-1-2z" /><path d="M11 9h5M11 13h5" /></>,
  shield: <><path d="M12 3l8 3v6c0 4.500-3.200 7.800-8 9-4.800-1.200-8-4.500-8-9V6z" /><path d="M8.500 12l2.500 2.500 4.500-5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500L19 19M19 5l-1.500 1.500M6.500 17.500L5 19" /></>,
  cloud: <><path d="M7 18a4 4 0 01-.5-8 5.500 5.500 0 0110.500 1.500A3.300 3.300 0 0117 18z" /></>,
  rain: <><path d="M7 14a4 4 0 01-.5-8 5.500 5.500 0 0110.500 1.500A3.300 3.300 0 0117 14z" /><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" /></>,
  leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19c3-5 6-8 10-10" /></>,
  alert: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.500 3.500-7 8-7s8 2.500 8 7" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  gate: <><path d="M4 21V9l8-5 8 5v12" /><path d="M9 21v-7a3 3 0 016 0v7" /></>,
  spark: <><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></>,
  wallet: <><path d="M3 7a2 2 0 012-2h13v4" /><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="16.500" cy="13.500" r="1" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
};

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {paths[name]}
    </svg>
  );
}

/** The Commonwealth emblem: a columned hall, echoing the civic architecture of the world. */
export function Emblem({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M6 18L24 7l18 11" />
      <path d="M9 18h30" />
      <path d="M11 21v14M19 21v14M29 21v14M37 21v14" />
      <path d="M7 38h34M5 42h38" />
      <circle cx="24" cy="14" r="1.600" fill="currentColor" />
    </svg>
  );
}
