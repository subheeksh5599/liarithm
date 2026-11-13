// Line icons drawn to match the reference's thin, light strokes.

type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const Star = ({ className }: P) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden>
    <path d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z" fill="currentColor" opacity="0.9" />
    <path d="M20 9 L21.5 18.5 L31 20 L21.5 21.5 L20 31 L18.5 21.5 L9 20 L18.5 18.5 Z" fill="#050505" />
  </svg>
);
export const Play = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M7 4.5 L19 12 L7 19.5 Z" fill="currentColor" />
  </svg>
);
export const Folder = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M3 7.5V18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-8.5L9.8 5.6A1 1 0 0 0 9 5.2H4a1 1 0 0 0-1 1Z" />
    <path d="M3 10h18" />
  </svg>
);
export const Bars = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M4 20h16M6 17v-4M10 17V9M14 17v-6M18 17V5" />
  </svg>
);
export const Ledger = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <rect x="4" y="3.5" width="16" height="17" rx="1" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
export const Info = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </svg>
);
export const Search = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 21 21" />
  </svg>
);
export const People = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16.5 14.6c2.6.2 4.4 1.9 5 4.6" />
  </svg>
);
export const Doc = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M6 3h8l4 4v14H6Z" />
    <path d="M14 3v4h4M9 12h6M9 15.5h6" />
  </svg>
);
export const Arrow = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M4 15c0-5 4-8 9-8h7M16 3l4 4-4 4" />
  </svg>
);
export const Send = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M3 4 21 12 3 20l3.5-8Z" />
    <path d="M6.5 12H13" />
  </svg>
);
export const Warn = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M12 3 22 20H2Z" />
    <path d="M12 10v5M12 17.5v.3" />
  </svg>
);
export const Print = ({ className }: P) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden {...base} strokeWidth={1.1}>
    <path d="M10 14c2-5 6-8 10-8s8 3 10 8" />
    <path d="M8 20c0-7 5-11 12-11s12 4 12 11c0 3-1 5-1 8" />
    <path d="M12 30c1-3 1-6 1-9 0-4 3-7 7-7s7 3 7 7c0 4-.5 8-2 12" />
    <path d="M16 33c1-3 1.5-7 1.5-11a2.5 2.5 0 0 1 5 0c0 5-1 9-3 13" />
    <path d="M20 21c0 5-1 10-3 14" />
  </svg>
);
export const Copy = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <rect x="8" y="8" width="12" height="12" rx="1" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </svg>
);
export const Card = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <rect x="3" y="6" width="18" height="12" rx="1.5" />
    <path d="M3 10h18M7 14.5h4" />
  </svg>
);
export const Wave = ({ on = false }: { on?: boolean }) => (
  <span className={`wave ${on ? "on" : ""}`} aria-hidden>
    {[6, 12, 8, 14, 7].map((h, i) => (
      <i key={i} style={{ height: h }} />
    ))}
  </span>
);
