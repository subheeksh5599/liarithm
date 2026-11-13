// Prices and cost per turn. List prices come from the SERV models page and include SERV Reasoning.

export interface Price {
  /** USD per million input tokens. */
  input: number;
  /** USD per million output tokens. */
  output: number;
}

/** https://docs.openserv.ai/serv-reasoning/models.md, read 13 Nov 2026. */
export const SERV_PRICES: Record<string, Price> = {
  "gpt-6-luna": { input: 0.13, output: 0.65 },
  "gpt-5.6-luna": { input: 0.25, output: 1.5 },
  "gpt-5.4-nano": { input: 0.25, output: 1.6 },
  "gpt-5.4-mini": { input: 1.0, output: 6.0 },
  "gemini-3.1-flash-lite": { input: 0.3, output: 1.8 },
  "claude-haiku-4.5": { input: 1.25, output: 6.5 },
};

/** SERV model ids carry feature suffixes (e.g. "-serv-kronos-multipath"); pricing is by the base model. */
export function baseModel(id: string): string {
  const i = id.indexOf("-serv");
  return i === -1 ? id : id.slice(0, i);
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

export function tokensOf(u: unknown): { input: number; output: number } {
  const x = (u ?? {}) as Usage;
  const input = Number.isFinite(x.prompt_tokens) ? Number(x.prompt_tokens) : 0;
  const output = Number.isFinite(x.completion_tokens) ? Number(x.completion_tokens) : 0;
  return { input: Math.max(0, input), output: Math.max(0, output) };
}

/** USD for one call at list price. Unknown models cost nothing here and are flagged by the caller. */
export function costOf(u: unknown, model: string): number {
  const p = SERV_PRICES[baseModel(model)];
  if (!p) return 0;
  const t = tokensOf(u);
  return (t.input * p.input + t.output * p.output) / 1_000_000;
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function percentile(xs: number[], p: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[i];
}

/**
 * Price to a studio per 1,000 character turns: measured cost per turn times a markup, rounded up to
 * the next cent. The markup covers the referee, hosting and margin.
 */
export function studioPricePer1000(costPerTurn: number, markup = 3): number {
  if (!(costPerTurn >= 0) || !(markup >= 1)) throw new Error("cost must be >= 0 and markup >= 1");
  // Round away float noise (0.0002 * 1000 * 3 * 100 = 60.000000000000004) before rounding up.
  const cents = Math.round(costPerTurn * 1000 * markup * 100 * 1e6) / 1e6;
  return Math.ceil(cents) / 100;
}
