import type { CaseFile } from "../types";
import { randomInt } from "node:crypto";
import { blackDiamond, blackDiamondVariants } from "./black-diamond";

export const cases: CaseFile[] = [blackDiamond];

/** Authored versions per case. Each version has a different thief. */
const variants: Record<string, CaseFile[]> = { "black-diamond": blackDiamondVariants };

/** Returns one version of a case: the given one, or the first when none is given. */
export function getCase(id: string, variant = 0): CaseFile | null {
  const list = variants[id] ?? cases.filter((c) => c.id === id);
  return list[variant] ?? null;
}

/** Draws a version at random, so the thief changes from one session to the next. */
export function drawCase(id: string): { c: CaseFile; variant: number } | null {
  const list = variants[id] ?? cases.filter((c) => c.id === id);
  if (!list.length) return null;
  const variant = randomInt(list.length);
  return { c: list[variant], variant };
}

export function variantCount(id: string): number {
  return (variants[id] ?? cases.filter((c) => c.id === id)).length;
}

/** The parts of a case the player may see. The truth and each suspect's secret stay on the server. */
export function publicCase(c: CaseFile) {
  return {
    id: c.id,
    number: c.number,
    title: c.title,
    logline: c.logline,
    cover: c.cover,
    difficulty: c.difficulty,
    turnLimit: c.turnLimit,
    briefing: c.briefing,
    slots: c.slots.map((s) => ({ id: s.id, label: s.label, values: Object.fromEntries(Object.entries(s.values).map(([k, v]) => [k, v.label])) })),
    suspects: c.suspects.map((s) => ({ id: s.id, name: s.name, role: s.role, portrait: s.portrait, face: s.face, background: s.background })),
    evidence: c.evidence.map((e) => ({ id: e.id, title: e.title, lines: e.lines, image: e.image })),
  };
}

export type PublicCase = ReturnType<typeof publicCase>;
