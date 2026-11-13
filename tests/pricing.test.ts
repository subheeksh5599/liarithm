import { describe, expect, it } from "vitest";
import { baseModel, costOf, median, percentile, SERV_PRICES, studioPricePer1000, tokensOf } from "@/lib/pricing";

describe("model ids", () => {
  const ids: [string, string][] = [
    ["gpt-6-luna-serv-kronos-multipath", "gpt-6-luna"],
    ["gpt-6-luna-serv-kronos", "gpt-6-luna"],
    ["gpt-6-luna", "gpt-6-luna"],
    ["claude-haiku-4.5-serv-multipath", "claude-haiku-4.5"],
    ["gemini-3.1-flash-lite", "gemini-3.1-flash-lite"],
  ];
  it.each(ids)("%s is priced as %s", (id, base) => expect(baseModel(id)).toBe(base));
});

describe("token counts", () => {
  const cases: [unknown, number, number][] = [
    [{ prompt_tokens: 1037, completion_tokens: 80 }, 1037, 80],
    [{ prompt_tokens: 10 }, 10, 0],
    [{}, 0, 0],
    [null, 0, 0],
    [undefined, 0, 0],
    [{ prompt_tokens: -5, completion_tokens: 3 }, 0, 3],
    [{ prompt_tokens: "12", completion_tokens: 3 }, 0, 3],
  ];
  it.each(cases)("%j → %i in, %i out", (u, i, o) => expect(tokensOf(u)).toEqual({ input: i, output: o }));
});

describe("cost of a call", () => {
  for (const [model, p] of Object.entries(SERV_PRICES)) {
    it(`${model}: one million input tokens costs the list input price`, () => {
      expect(costOf({ prompt_tokens: 1_000_000, completion_tokens: 0 }, model)).toBeCloseTo(p.input, 10);
    });
    it(`${model}: one million output tokens costs the list output price`, () => {
      expect(costOf({ prompt_tokens: 0, completion_tokens: 1_000_000 }, model)).toBeCloseTo(p.output, 10);
    });
    it(`${model}: the SERV feature suffix does not change the price`, () => {
      const u = { prompt_tokens: 1234, completion_tokens: 56 };
      expect(costOf(u, `${model}-serv-kronos-multipath`)).toBe(costOf(u, model));
    });
  }
  it("an unknown model costs nothing here", () => expect(costOf({ prompt_tokens: 100 }, "mystery")).toBe(0));
  it("a measured SERV move (1,037 in, 80 out on gpt-6-luna) costs about $0.00019", () => {
    expect(costOf({ prompt_tokens: 1037, completion_tokens: 80 }, "gpt-6-luna-serv-kronos-multipath")).toBeCloseTo(0.000187, 6);
  });
});

describe("summaries", () => {
  const med: [number[], number][] = [
    [[], 0],
    [[5], 5],
    [[3, 1, 2], 2],
    [[4, 1, 3, 2], 2.5],
  ];
  it.each(med)("median of %j is %d", (xs, m) => expect(median(xs)).toBe(m));
  const pct: [number[], number, number][] = [
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90, 9],
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 100, 10],
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50, 5],
    [[7], 95, 7],
    [[], 95, 0],
  ];
  it.each(pct)("p%2$i of %1$j is %3$d", (xs, p, v) => expect(percentile(xs, p)).toBe(v));
});

describe("studio price", () => {
  const cases: [number, number, number][] = [
    [0.0002, 3, 0.6],
    [0.0002, 1, 0.2],
    [0.001, 3, 3],
    [0, 3, 0],
    [0.00012345, 3, 0.38],
  ];
  it.each(cases)("cost %d per turn with markup %d is $%d per 1,000 turns", (c, m, p) => expect(studioPricePer1000(c, m)).toBe(p));
  it("a markup under 1 is refused", () => expect(() => studioPricePer1000(0.001, 0.5)).toThrow());
  it("a negative cost is refused", () => expect(() => studioPricePer1000(-1)).toThrow());
});
