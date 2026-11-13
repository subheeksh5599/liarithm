import type { CaseFile } from "../types";
import { blackDiamond } from "./black-diamond";

export const cases: CaseFile[] = [blackDiamond];

export function getCase(id: string): CaseFile | null {
  return cases.find((c) => c.id === id) ?? null;
}

/** The parts of a case the player may see. The truth and each suspect's secret stay on the server. */
export function publicCase(c: CaseFile) {
  return {
    id: c.id,
    number: c.number,
    title: c.title,
    logline: c.logline,
    difficulty: c.difficulty,
    turnLimit: c.turnLimit,
    briefing: c.briefing,
    slots: c.slots.map((s) => ({ id: s.id, label: s.label, values: Object.fromEntries(Object.entries(s.values).map(([k, v]) => [k, v.label])) })),
    suspects: c.suspects.map((s) => ({ id: s.id, name: s.name, role: s.role, portrait: s.portrait, background: s.background, prompts: s.prompts })),
    evidence: c.evidence.map((e) => ({ id: e.id, title: e.title, lines: e.lines, image: e.image })),
  };
}

export type PublicCase = ReturnType<typeof publicCase>;
