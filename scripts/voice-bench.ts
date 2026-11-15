// Villain-voice benchmark: the same in-character scenes, voiced by Dolphin's open model and by
// closed models served through SERV. Every call goes to a cloud API; nothing runs locally.
//
// A line fails when it refuses, breaks character or lectures (lib/bench/villain.ts isRefusal), or
// when the referee finds a leak in it.
// Usage: npx tsx --env-file=.env.local scripts/voice-bench.ts
// Writes docs/results/voice-bench.json.

import { mkdirSync, writeFileSync } from "node:fs";
import { blackDiamondVariants } from "../lib/cases/black-diamond";
import { cleanLine, voiceSystemPrompt } from "../lib/models";
import { median } from "../lib/pricing";
import { checkLine } from "../lib/referee";
import { isRefusal, sceneMove, VILLAIN_SCENES } from "../lib/bench/villain";

const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing ${k}`);
  return v;
};

interface Voice {
  name: string;
  open: boolean;
  base: string;
  key: string;
  model: string;
  extra: Record<string, unknown>;
}

const voices: Voice[] = [
  { name: "Dolphin · DeepSeek V4.1 Flash (open weights)", open: true, base: env("DOLPHIN_BASE_URL"), key: env("DOLPHIN_API_KEY"), model: env("DOLPHIN_MODEL"), extra: { max_tokens: 400, reasoning_effort: "low" } },
  { name: "SERV · gpt-6-luna (closed)", open: false, base: env("SERV_BASE_URL"), key: env("SERV_API_KEY"), model: "gpt-6-luna", extra: { max_completion_tokens: 400 } },
  { name: "SERV · claude-haiku-4.5 (closed)", open: false, base: env("SERV_BASE_URL"), key: env("SERV_API_KEY"), model: "claude-haiku-4.5", extra: { max_tokens: 400 } },
  { name: "SERV · gemini-3.1-flash-lite (closed)", open: false, base: env("SERV_BASE_URL"), key: env("SERV_API_KEY"), model: "gemini-3.1-flash-lite", extra: { max_tokens: 400 } },
];

async function speak(v: Voice, system: string, question: string): Promise<{ line: string; ms: number }> {
  const t0 = Date.now();
  for (let k = 0; k < 3; k++) {
    const res = await fetch(`${v.base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: v.model, messages: [{ role: "system", content: system }, { role: "user", content: question }], ...v.extra }),
      signal: AbortSignal.timeout(120_000),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as Response);
    if (res.ok) {
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return { line: cleanLine(j.choices?.[0]?.message?.content ?? ""), ms: Date.now() - t0 };
    }
    if (res.status !== 429 && res.status < 500 && res.status !== 0) throw new Error(`${v.name} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await new Promise((r) => setTimeout(r, 10_000 * (k + 1)));
  }
  throw new Error(`${v.name}: no answer after retries`);
}

async function main() {
  const rows: Record<string, unknown>[] = [];
  for (const c of blackDiamondVariants) {
    const thief = c.truth.culprit;
    for (const scene of VILLAIN_SCENES) {
      const move = sceneMove(scene);
      const system = voiceSystemPrompt(c, thief, move, null);
      await Promise.all(
        voices.map(async (v) => {
          try {
            const { line, ms } = await speak(v, system, scene.question);
            const refusal = isRefusal(line);
            const leaks = checkLine(c, thief, line, move, []).leaks;
            rows.push({ voice: v.name, open: v.open, thief, question: scene.question, line, refusal, leaks, ms });
            console.log(`${thief} | ${v.name.padEnd(42)} | ${refusal ? "REFUSED" : leaks.length ? "LEAK" : "ok"} | ${line.slice(0, 90)}`);
          } catch (e) {
            rows.push({ voice: v.name, open: v.open, thief, question: scene.question, error: String(e) });
            console.log(`${thief} | ${v.name} | ERROR ${String(e).slice(0, 100)}`);
          }
        }),
      );
    }
  }
  const summary = voices.map((v) => {
    const mine = rows.filter((r) => r.voice === v.name && !r.error);
    const empty = mine.filter((r) => !(r.line as string)).length;
    const refused = mine.filter((r) => r.refusal).length;
    const leaked = mine.filter((r) => (r.leaks as string[]).length > 0).length;
    return {
      voice: v.name,
      open: v.open,
      scenes: mine.length,
      errors: rows.filter((r) => r.voice === v.name && r.error).length,
      empty,
      refusedOrBrokeCharacter: refused,
      leaked,
      playedTheScene: mine.filter((r) => r.line && !r.refusal && (r.leaks as string[]).length === 0).length,
      msMedian: median(mine.map((r) => r.ms as number)),
    };
  });
  mkdirSync("docs/results", { recursive: true });
  writeFileSync("docs/results/voice-bench.json", JSON.stringify({ ranAt: new Date().toISOString(), summary, rows }, null, 2) + "\n");
  console.table(summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
