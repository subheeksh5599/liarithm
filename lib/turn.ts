// One turn of questioning: brain decides, referee checks the move, voice speaks, referee checks the line.

import { decideMove, hasVoice, phraseWithBrain, speakLine } from "./models";
import { checkLine, checkMove } from "./referee";
import type { CaseFile, Claim, LogEntry, Move } from "./types";

export class TurnRefused extends Error {}

export interface TurnResult {
  line: string;
  claims: Claim[];
  move: Move;
  guarded: boolean;
  brain: string;
  voice: string;
  /** Claims the brain proposed that the referee dropped because they were not allowed. */
  droppedClaims: string[];
  /** Spoken lines the referee threw away before one passed. */
  rejectedLines: { line: string; leaks: string[] }[];
  usage: { brain: unknown; voice: unknown[] };
  ms: { brain: number; voice: number; total: number };
}

/**
 * Runs one turn. `shown` is every evidence id this suspect has seen, including any shown now.
 * The returned line has passed the referee; nothing else is ever returned.
 */
export async function runTurn(c: CaseFile, suspectId: string, question: string, evidence: string | null, shown: string[], log: LogEntry[]): Promise<TurnResult> {
  const t0 = Date.now();
  const ev = evidence ? c.evidence.find((e) => e.id === evidence) ?? null : null;
  const asked = ev ? `${question}\n[The detective shows you: ${ev.title}. ${ev.lines.join(". ")}]` : question;

  const brain = await decideMove(c, suspectId, asked, shown, evidence, log);
  const tBrain = Date.now();
  const moveCheck = checkMove(c, suspectId, brain.move, shown);
  if (!moveCheck.ok) {
    // A move outside the rules is never voiced. Keep only the claims that pass on their own.
    brain.move.claims = brain.move.claims.filter((cl) => checkMove(c, suspectId, { ...brain.move, claims: [cl] }, shown).ok);
  }

  const rejectedLines: TurnResult["rejectedLines"] = [];
  const voiceUsage: unknown[] = [];
  let line = "";
  let voice = "";
  let claims: Claim[] = [];
  for (let k = 0; k < (hasVoice() ? 3 : 0); k++) {
    const note = rejectedLines.length ? rejectedLines[rejectedLines.length - 1].leaks.join("; ") : null;
    const spoken = await speakLine(c, suspectId, asked, brain.move, log, note);
    voiceUsage.push(spoken.usage);
    const lc = checkLine(c, suspectId, spoken.line, brain.move, shown);
    if (lc.ok && spoken.line) {
      line = spoken.line;
      voice = spoken.voice;
      claims = lc.claims;
      break;
    }
    rejectedLines.push({ line: spoken.line, leaks: lc.leaks.length ? lc.leaks : ["empty line"] });
  }
  if (!line) {
    const phrased = await phraseWithBrain(c, suspectId, asked, brain.move);
    const lc = checkLine(c, suspectId, phrased, brain.move, shown);
    if (!lc.ok || !phrased) throw new TurnRefused("They hesitate. Ask again.");
    line = phrased;
    voice = brain.brain;
    claims = lc.claims;
  }
  const tEnd = Date.now();
  return {
    line,
    claims,
    move: brain.move,
    guarded: brain.guarded,
    brain: brain.brain,
    voice,
    droppedClaims: moveCheck.ok ? [] : moveCheck.errors,
    rejectedLines,
    usage: { brain: brain.usage, voice: voiceUsage },
    ms: { brain: tBrain - t0, voice: tEnd - tBrain, total: tEnd - t0 },
  };
}
