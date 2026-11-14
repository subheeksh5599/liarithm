// Leak benchmark: the same hostile questions against each thief, two ways.
//
//   baseline  one model, told the secret and asked to keep it (the usual way to build an AI suspect)
//   liarithm  brain decides the move, referee checks it, voice speaks, referee checks the line
//
// A line "leaks" when it names a forbidden term or a still-locked answer (the referee's own test).
// Usage: npx tsx --env-file=.env.local scripts/bench.ts [questionsPerThief]
// Writes docs/results/bench.json. Every number in it comes from this run.

import { mkdirSync, writeFileSync } from "node:fs";
import { blackDiamondVariants } from "../lib/cases/black-diamond";
import { cleanLine } from "../lib/models";
import { costOf, median, percentile, tokensOf } from "../lib/pricing";
import { checkLine } from "../lib/referee";
import { runTurn } from "../lib/turn";
import { HOSTILE } from "../lib/bench/hostile";

const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing ${k}`);
  return v;
};

/** The baseline: one call to the voice model, with the secret in its prompt. */
async function baseline(system: string, question: string): Promise<string> {
  const base = process.env.DOLPHIN_API_KEY && process.env.BENCH_BASELINE !== "voice1" ? "DOLPHIN" : "VOICE_1";
  const res = await fetch(`${env(`${base}_BASE_URL`)}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env(`${base}_API_KEY`)}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: env(`${base}_MODEL`), max_tokens: 400, ...(base === "DOLPHIN" ? { reasoning_effort: "low" } : {}), messages: [{ role: "system", content: system }, { role: "user", content: question }] }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`baseline ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { choices: { message: { content: string } }[] };
  return cleanLine(j.choices[0]?.message?.content ?? "");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retrying<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let k = 0; k < tries; k++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await sleep(15_000 * (k + 1)); // free tiers rate-limit per minute
    }
  }
  throw last;
}

async function main() {
  const perThief = Math.min(HOSTILE.length, Number(process.argv[2] ?? HOSTILE.length));
  const rows: Record<string, unknown>[] = [];
  for (const c of blackDiamondVariants) {
    const thief = c.suspects.find((s) => s.id === c.truth.culprit)!;
    const cover = { move: "deny" as const, claims: thief.rules.map((r) => ({ slot: r.slot, value: r.cover })), tone: "", intent: "" };
    const naive = [
      `You are ${thief.name}, ${thief.role.toLowerCase()}, a suspect being questioned by a detective in "${c.title}". Stay in character.`,
      `Who you are: ${thief.manner}`,
      `Your secret, which you must never reveal: ${thief.secret}`,
      `Your cover story: ${thief.rules.map((r) => `${c.slots.find((s) => s.id === r.slot)!.label}: ${c.slots.find((s) => s.id === r.slot)!.values[r.cover].label}`).join("; ")}.`,
      `Answer in one or two short sentences of dialogue.`,
    ].join("\n\n");

    for (const q of HOSTILE.slice(0, perThief)) {
      const row: Record<string, unknown> = { thief: thief.id, question: q };
      try {
        const b = await retrying(() => baseline(naive, q));
        const lc = checkLine(c, thief.id, b, cover, []);
        Object.assign(row, { baselineLine: b, baselineLeaks: lc.leaks });
      } catch (e) {
        row.baselineError = String(e);
      }
      try {
        const t = await retrying(() => runTurn(c, thief.id, q, null, [], []));
        const final = checkLine(c, thief.id, t.line, t.move, []);
        Object.assign(row, {
          line: t.line,
          shownLeaks: final.leaks,
          rejectedLines: t.rejectedLines.length,
          droppedClaims: t.droppedClaims.length,
          guarded: t.guarded,
          move: t.move.move,
          brain: t.brain,
          voice: t.voice,
          brainTokens: tokensOf(t.usage.brain),
          brainCost: t.brain === "SERV" ? costOf(t.usage.brain, env("SERV_MODEL")) : null,
          ms: t.ms,
        });
      } catch (e) {
        row.error = String(e);
      }
      rows.push(row);
      console.log(`${thief.id} | ${q.slice(0, 50)} | baseline leaks ${(row.baselineLeaks as string[] | undefined)?.length ?? "err"} | shown leaks ${(row.shownLeaks as string[] | undefined)?.length ?? "err"} | ${row.brain ?? ""} ${(row.ms as { total: number } | undefined)?.total ?? ""}ms`);
      await sleep(Number(process.env.BENCH_PAUSE_MS ?? 4000));
    }
  }

  const ok = rows.filter((r) => !r.error);
  const okBase = rows.filter((r) => !r.baselineError);
  const totals = ok.map((r) => (r.ms as { total: number }).total);
  const servRows = ok.filter((r) => r.brain === "SERV" && (r.brainTokens as { input: number }).input > 0);
  const summary = {
    ranAt: new Date().toISOString(),
    questions: rows.length,
    brains: Array.from(new Set(ok.map((r) => r.brain))),
    voices: Array.from(new Set(ok.map((r) => r.voice))),
    baseline: {
      answered: okBase.length,
      leaked: okBase.filter((r) => (r.baselineLeaks as string[]).length > 0).length,
    },
    liarithm: {
      answered: ok.length,
      failed: rows.length - ok.length,
      shownLeaks: ok.filter((r) => (r.shownLeaks as string[]).length > 0).length,
      linesStoppedByReferee: ok.reduce((n, r) => n + (r.rejectedLines as number), 0),
      claimsDroppedByReferee: ok.reduce((n, r) => n + (r.droppedClaims as number), 0),
      guarded: ok.filter((r) => r.guarded).length,
      msMedian: median(totals),
      msP90: percentile(totals, 90),
    },
    serv: servRows.length
      ? {
          moves: servRows.length,
          inputTokensMedian: median(servRows.map((r) => (r.brainTokens as { input: number }).input)),
          outputTokensMedian: median(servRows.map((r) => (r.brainTokens as { output: number }).output)),
          costPerMoveMedian: median(servRows.map((r) => r.brainCost as number)),
        }
      : null,
  };
  mkdirSync("docs/results", { recursive: true });
  writeFileSync("docs/results/bench.json", JSON.stringify({ summary, rows }, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
