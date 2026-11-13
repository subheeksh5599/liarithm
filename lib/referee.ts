// The referee. Plain code: no model ever decides what is allowed, what leaked, or who lied.

import type { CaseFile, Claim, Contradiction, LogEntry, Move } from "./types";

export function suspectRules(c: CaseFile, suspectId: string) {
  const s = c.suspects.find((x) => x.id === suspectId);
  if (!s) throw new Error(`Unknown suspect: ${suspectId}`);
  return s;
}

/** Values this suspect may claim for each of their slots, given the evidence already shown to them. */
export function allowedValues(c: CaseFile, suspectId: string, shownToSuspect: string[]): Record<string, string[]> {
  const s = suspectRules(c, suspectId);
  const out: Record<string, string[]> = {};
  for (const r of s.rules) {
    const unlocked = r.admitAfter.length > 0 && r.admitAfter.some((e) => shownToSuspect.includes(e));
    out[r.slot] = r.truth === r.cover || unlocked ? Array.from(new Set([r.cover, r.truth])) : [r.cover];
  }
  return out;
}

export interface MoveCheck {
  ok: boolean;
  errors: string[];
}

/** Rule: every claim is about a slot this suspect knows, with a value they are allowed to state right now. */
export function checkMove(c: CaseFile, suspectId: string, move: Move, shownToSuspect: string[]): MoveCheck {
  const allowed = allowedValues(c, suspectId, shownToSuspect);
  const errors: string[] = [];
  for (const cl of move.claims) {
    if (!(cl.slot in allowed)) errors.push(`claim on unknown slot ${cl.slot}`);
    else if (!allowed[cl.slot].includes(cl.value)) errors.push(`claim ${cl.slot}=${cl.value} is locked`);
  }
  return { ok: errors.length === 0, errors };
}

const norm = (t: string) => ` ${t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9':.\s-]/g, " ").replace(/\s+/g, " ")} `;

function mentions(text: string, alias: string): boolean {
  const a = alias.toLowerCase().replace(/[^a-z0-9':.\s-]/g, " ").trim();
  const re = new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`);
  return re.test(text);
}

export interface LineCheck {
  ok: boolean;
  leaks: string[];
  /** Claims logged for this line: exactly the claims the checked move committed to. */
  claims: Claim[];
}

/**
 * Rules: the line never names a forbidden term and never names a value that is still locked.
 * Only the move's own claims are logged, so a passing mention can't be turned into testimony.
 */
export function checkLine(c: CaseFile, suspectId: string, line: string, move: Move, shownToSuspect: string[]): LineCheck {
  const s = suspectRules(c, suspectId);
  const text = norm(line);
  const leaks: string[] = [];
  for (const f of s.forbidden) if (mentions(text, f)) leaks.push(`forbidden: "${f}"`);

  const allowed = allowedValues(c, suspectId, shownToSuspect);
  for (const r of s.rules) {
    const slot = c.slots.find((x) => x.id === r.slot);
    if (!slot) continue;
    for (const [valueId, v] of Object.entries(slot.values)) {
      if (allowed[r.slot].includes(valueId)) continue;
      if (v.aliases.some((a) => mentions(text, a))) leaks.push(`locked value named: ${r.slot}=${valueId}`);
    }
  }
  return { ok: leaks.length === 0, leaks, claims: [...move.claims] };
}

/** A lie is proven when evidence fixes a slot and a logged claim on that slot says otherwise. Comparison only. */
export function findContradictions(c: CaseFile, log: Pick<LogEntry, "i" | "suspectId" | "claims">[], evidenceIds: string[]): Contradiction[] {
  const out: Contradiction[] = [];
  for (const evId of evidenceIds) {
    const ev = c.evidence.find((e) => e.id === evId);
    if (!ev) continue;
    for (const fix of ev.fixes) {
      for (const entry of log) {
        for (const cl of entry.claims) {
          if (cl.slot === fix.slot && cl.value !== fix.value) {
            if (!out.some((o) => o.entry === entry.i && o.slot === cl.slot && o.evidenceId === evId)) {
              out.push({ suspectId: entry.suspectId, evidenceId: evId, slot: cl.slot, claimed: cl.value, proven: fix.value, entry: entry.i });
            }
          }
        }
      }
    }
  }
  return out;
}

export interface Verdict {
  correct: boolean;
  proven: boolean;
  won: boolean;
  reason: string;
}

/** You win only by naming the culprit AND holding at least one proven lie of theirs. */
export function judgeAccusation(c: CaseFile, accused: string, contradictions: Contradiction[]): Verdict {
  const correct = accused === c.truth.culprit;
  const proven = contradictions.some((x) => x.suspectId === accused);
  if (correct && proven) return { correct, proven, won: true, reason: "Right person, and you caught them lying." };
  if (correct) return { correct, proven, won: false, reason: "Right person, but you never caught them in a lie. A guess is not a case." };
  if (proven) return { correct, proven, won: false, reason: "They lied to you, but not about the theft. Liars aren't always thieves." };
  return { correct, proven, won: false, reason: "Wrong person, and no proven lie to back it." };
}
