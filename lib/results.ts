// Reads the measured benchmark results and turns them into the figures the site shows.

import bench from "@/docs/results/bench.json";
import { costOf, median, SERV_PRICES, studioPricePer1000 } from "./pricing";

interface Row {
  move?: string;
  brain?: string;
  brainTokens?: { input: number; output: number };
  shownLeaks?: string[];
  ms?: { total: number };
}

const rows = (bench as { rows: Row[] }).rows;
const summary = (bench as { summary: Record<string, unknown> }).summary as {
  ranAt: string;
  questions: number;
  brains: string[];
  baseline: { answered: number; leaked: number };
  liarithm: { answered: number; failed: number; shownLeaks: number; linesStoppedByReferee: number; claimsDroppedByReferee: number; guarded: number; msMedian: number; msP90: number };
};

/** The SERV model the game runs on, priced at SERV's list price. */
export const PRICED_MODEL = "gpt-6-luna";

const answered = rows.filter((r) => r.brainTokens);
export const measured = {
  ranAt: summary.ranAt,
  questions: summary.questions,
  brains: summary.brains,
  shownLeaks: summary.liarithm.shownLeaks,
  answered: summary.liarithm.answered,
  stopped: summary.liarithm.linesStoppedByReferee,
  baselineLeaked: summary.baseline.leaked,
  baselineAnswered: summary.baseline.answered,
  msMedian: summary.liarithm.msMedian,
  msP90: summary.liarithm.msP90,
  moves: rows.reduce<Record<string, number>>((m, r) => (r.move ? { ...m, [r.move]: (m[r.move] ?? 0) + 1 } : m), {}),
  inputTokens: median(answered.map((r) => r.brainTokens!.input)),
  outputTokens: median(answered.map((r) => r.brainTokens!.output)),
};

/** Cost of one brain move: measured token counts at SERV's list price for the game's model. */
export const costPerMove = costOf({ prompt_tokens: measured.inputTokens, completion_tokens: measured.outputTokens }, PRICED_MODEL);
export const price = SERV_PRICES[PRICED_MODEL];
export const studioPrice = studioPricePer1000(costPerMove, 3);
