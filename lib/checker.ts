// The case checker. Plain code: it proves a case file is well formed and can be won from its own evidence.

import type { CaseFile } from "./types";

export type IssueCode =
  | "SHAPE"
  | "DUPLICATE_ID"
  | "UNKNOWN_SLOT"
  | "UNKNOWN_VALUE"
  | "UNKNOWN_EVIDENCE"
  | "UNKNOWN_CULPRIT"
  | "SLOT_OWNED_TWICE"
  | "NO_PROVABLE_LIE"
  | "LIE_NEVER_ADMITTED"
  | "HONEST_CONTRADICTED"
  | "FACT_MISMATCH"
  | "FORBIDDEN_IS_COVER"
  | "TURN_LIMIT"
  | "TOO_FEW_SUSPECTS";

export interface Issue {
  code: IssueCode;
  /** Where the problem is, e.g. "suspects.kai.rules[0]". */
  at: string;
  message: string;
}

export interface CheckReport {
  ok: boolean;
  culprit: string | null;
  issues: Issue[];
  /** Every lie a player can prove, as (suspect, slot, evidence). */
  provableLies: { suspectId: string; slot: string; evidenceId: string }[];
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** Rejects anything that is not shaped like a case file, before any rule is checked. */
export function checkShape(input: unknown): Issue[] {
  const out: Issue[] = [];
  const bad = (at: string, message: string) => out.push({ code: "SHAPE", at, message });
  if (!isObj(input)) return [{ code: "SHAPE", at: "", message: "A case file must be a JSON object." }];
  for (const k of ["id", "title"]) if (!isStr(input[k])) bad(k, `"${k}" must be a non-empty string.`);
  if (typeof input.turnLimit !== "number") bad("turnLimit", '"turnLimit" must be a number.');
  for (const k of ["slots", "suspects", "evidence"]) if (!Array.isArray(input[k])) bad(k, `"${k}" must be an array.`);
  if (!isObj(input.truth)) bad("truth", '"truth" must be an object with culprit, summary and facts.');
  else {
    if (!isStr(input.truth.culprit)) bad("truth.culprit", '"truth.culprit" must name a suspect id.');
    if (!isObj(input.truth.facts)) bad("truth.facts", '"truth.facts" must be an object.');
  }
  if (out.length) return out;
  (input.slots as unknown[]).forEach((s, i) => {
    if (!isObj(s) || !isStr(s.id) || !isObj(s.values)) bad(`slots[${i}]`, "Each slot needs an id and a values object.");
    else
      for (const [vid, v] of Object.entries(s.values))
        if (!isObj(v) || !Array.isArray(v.aliases)) bad(`slots[${i}].values.${vid}`, "Each value needs a label and an aliases array.");
  });
  (input.suspects as unknown[]).forEach((s, i) => {
    if (!isObj(s) || !isStr(s.id) || !Array.isArray(s.rules) || !Array.isArray(s.forbidden)) bad(`suspects[${i}]`, "Each suspect needs an id, a rules array and a forbidden array.");
    else
      (s.rules as unknown[]).forEach((r, j) => {
        if (!isObj(r) || !isStr(r.slot) || !isStr(r.cover) || !isStr(r.truth) || !Array.isArray(r.admitAfter)) bad(`suspects[${i}].rules[${j}]`, "Each rule needs slot, cover, truth and admitAfter.");
      });
  });
  (input.evidence as unknown[]).forEach((e, i) => {
    if (!isObj(e) || !isStr(e.id) || !Array.isArray(e.fixes)) bad(`evidence[${i}]`, "Each evidence item needs an id and a fixes array.");
    else
      (e.fixes as unknown[]).forEach((f, j) => {
        if (!isObj(f) || !isStr(f.slot) || !isStr(f.value)) bad(`evidence[${i}].fixes[${j}]`, "Each fix needs a slot and a value.");
      });
  });
  return out;
}

/**
 * Checks one version of a case. A version passes when:
 * every reference resolves, the thief has at least one lie that a piece of evidence proves and that
 * the thief can be pushed into admitting, no honest statement is ever "proven" false, and the
 * evidence agrees with the hidden truth.
 */
export function checkCase(input: unknown): CheckReport {
  const shape = checkShape(input);
  if (shape.length) return { ok: false, culprit: null, issues: shape, provableLies: [] };
  const c = input as CaseFile;
  const issues: Issue[] = [];
  const add = (code: IssueCode, at: string, message: string) => issues.push({ code, at, message });

  const dupes = (ids: string[], what: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) add("DUPLICATE_ID", what, `Two ${what} share the id "${id}".`);
      seen.add(id);
    }
  };
  dupes(c.slots.map((s) => s.id), "slots");
  dupes(c.suspects.map((s) => s.id), "suspects");
  dupes(c.evidence.map((e) => e.id), "evidence");

  if (c.suspects.length < 2) add("TOO_FEW_SUSPECTS", "suspects", "A case needs at least two suspects, or there is nothing to deduce.");
  if (!Number.isInteger(c.turnLimit) || c.turnLimit < 4 || c.turnLimit > 200) add("TURN_LIMIT", "turnLimit", "The turn limit must be a whole number from 4 to 200.");

  const slot = (id: string) => c.slots.find((s) => s.id === id);
  const evidence = (id: string) => c.evidence.find((e) => e.id === id);

  // References.
  const owner = new Map<string, string>();
  for (const s of c.suspects) {
    s.rules.forEach((r, j) => {
      const at = `suspects.${s.id}.rules[${j}]`;
      const sl = slot(r.slot);
      if (!sl) return add("UNKNOWN_SLOT", at, `Rule names slot "${r.slot}", which is not defined.`);
      if (owner.has(r.slot) && owner.get(r.slot) !== s.id) add("SLOT_OWNED_TWICE", at, `Slot "${r.slot}" belongs to both ${owner.get(r.slot)} and ${s.id}.`);
      owner.set(r.slot, s.id);
      for (const v of [r.cover, r.truth]) if (!(v in sl.values)) add("UNKNOWN_VALUE", at, `Slot "${r.slot}" has no value "${v}".`);
      for (const e of r.admitAfter) if (!evidence(e)) add("UNKNOWN_EVIDENCE", at, `Rule unlocks after "${e}", which is not in the evidence.`);
    });
  }
  c.evidence.forEach((e) => {
    e.fixes.forEach((f, j) => {
      const at = `evidence.${e.id}.fixes[${j}]`;
      const sl = slot(f.slot);
      if (!sl) return add("UNKNOWN_SLOT", at, `Evidence fixes slot "${f.slot}", which is not defined.`);
      if (!(f.value in sl.values)) add("UNKNOWN_VALUE", at, `Slot "${f.slot}" has no value "${f.value}".`);
    });
  });
  const culprit = c.suspects.find((s) => s.id === c.truth.culprit);
  if (!culprit) add("UNKNOWN_CULPRIT", "truth.culprit", `The culprit "${c.truth.culprit}" is not one of the suspects.`);
  for (const [sid, v] of Object.entries(c.truth.facts)) {
    const sl = slot(sid);
    if (!sl) add("UNKNOWN_SLOT", `truth.facts.${sid}`, `The truth names slot "${sid}", which is not defined.`);
    else if (!(v in sl.values)) add("UNKNOWN_VALUE", `truth.facts.${sid}`, `Slot "${sid}" has no value "${v}".`);
  }
  if (issues.length) return { ok: false, culprit: c.truth.culprit, issues, provableLies: [] };

  // Evidence must agree with the truth: anything evidence fixes is the true value of that slot.
  const truthOf = (slotId: string): string | undefined => {
    for (const s of c.suspects) for (const r of s.rules) if (r.slot === slotId) return r.truth;
    return c.truth.facts[slotId];
  };
  for (const e of c.evidence)
    for (const f of e.fixes) {
      const t = truthOf(f.slot);
      if (t !== undefined && t !== f.value) add("FACT_MISMATCH", `evidence.${e.id}`, `${e.id} proves ${f.slot}=${f.value}, but the truth is ${t}.`);
    }
  for (const [sid, v] of Object.entries(c.truth.facts)) {
    const t = truthOf(sid);
    if (t !== undefined && t !== v) add("FACT_MISMATCH", `truth.facts.${sid}`, `The truth says ${sid}=${v}, but the suspect's rule says ${t}.`);
  }

  // An honest answer (cover equals truth) must never be contradicted by evidence.
  for (const s of c.suspects)
    for (const r of s.rules) {
      if (r.cover !== r.truth) continue;
      for (const e of c.evidence)
        for (const f of e.fixes)
          if (f.slot === r.slot && f.value !== r.cover) add("HONEST_CONTRADICTED", `suspects.${s.id}`, `${s.id} tells the truth about ${r.slot}, but ${e.id} would "prove" it a lie.`);
    }

  // A forbidden word that names the cover story would block the suspect's own alibi.
  for (const s of c.suspects)
    for (const r of s.rules) {
      const cover = slot(r.slot)?.values[r.cover];
      for (const f of s.forbidden) {
        const fl = f.toLowerCase();
        if (cover && (cover.label.toLowerCase() === fl || cover.aliases.some((a) => a.toLowerCase() === fl)))
          add("FORBIDDEN_IS_COVER", `suspects.${s.id}.forbidden`, `"${f}" is forbidden for ${s.id} but is also how they say their own cover story.`);
      }
    }

  // Provable lies: a rule whose cover is false and some evidence fixes the slot to the truth.
  const provableLies: CheckReport["provableLies"] = [];
  for (const s of c.suspects)
    for (const r of s.rules) {
      if (r.cover === r.truth) continue;
      for (const e of c.evidence) if (e.fixes.some((f) => f.slot === r.slot && f.value === r.truth)) provableLies.push({ suspectId: s.id, slot: r.slot, evidenceId: e.id });
    }

  if (culprit) {
    const lies = provableLies.filter((l) => l.suspectId === culprit.id);
    if (!lies.length) add("NO_PROVABLE_LIE", `suspects.${culprit.id}`, `No evidence proves a lie by the culprit ${culprit.id}, so the case cannot be won.`);
    for (const r of culprit.rules) {
      if (r.cover === r.truth) continue;
      if (lies.some((l) => l.slot === r.slot) && r.admitAfter.length === 0)
        add("LIE_NEVER_ADMITTED", `suspects.${culprit.id}`, `${culprit.id} can never admit ${r.slot}, even when the evidence is shown. Give it an admitAfter.`);
    }
  }

  return { ok: issues.length === 0, culprit: c.truth.culprit, issues, provableLies };
}

/** Checks every version of a case, plus what must hold across versions: each version has a different thief. */
export function checkVersions(inputs: unknown[]): { ok: boolean; versions: CheckReport[]; issues: Issue[] } {
  const versions = inputs.map((v) => checkCase(v));
  const issues: Issue[] = [];
  const thieves = versions.map((v) => v.culprit).filter((x): x is string => !!x);
  const seen = new Set<string>();
  thieves.forEach((t, i) => {
    if (seen.has(t)) issues.push({ code: "DUPLICATE_ID", at: `versions[${i}]`, message: `Two versions have the same thief, ${t}.` });
    seen.add(t);
  });
  return { ok: versions.every((v) => v.ok) && issues.length === 0, versions, issues };
}
