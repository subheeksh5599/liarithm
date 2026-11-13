import { describe, expect, it } from "vitest";
import { blackDiamondVariants } from "@/lib/cases/black-diamond";
import { sampleCase } from "@/lib/cases/sample";
import { checkCase, checkShape, checkVersions, type IssueCode } from "@/lib/checker";
import type { CaseFile } from "@/lib/types";

const clone = <T,>(v: T): T => structuredClone(v);
const codes = (c: unknown) => checkCase(c).issues.map((i) => i.code);
const all: [string, CaseFile][] = [...blackDiamondVariants.map((v) => [`black-diamond/${v.truth.culprit}`, v] as [string, CaseFile]), ["sample", sampleCase]];

describe("every shipped case passes", () => {
  it.each(all)("%s is solvable", (_n, c) => {
    const r = checkCase(c);
    expect(r.issues).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it.each(all)("%s convicts its own thief", (_n, c) => {
    expect(checkCase(c).provableLies.some((l) => l.suspectId === c.truth.culprit)).toBe(true);
  });

  it("the four versions have four different thieves", () => {
    expect(checkVersions(blackDiamondVariants).ok).toBe(true);
  });

  it("two versions with the same thief are refused", () => {
    const r = checkVersions([blackDiamondVariants[0], blackDiamondVariants[0]]);
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe("DUPLICATE_ID");
  });
});

describe("malformed input is refused before any rule runs", () => {
  const bad: [string, unknown][] = [
    ["null", null],
    ["a number", 42],
    ["a string", "case"],
    ["an array", []],
    ["an empty object", {}],
    ["missing id", { ...clone(sampleCase), id: "" }],
    ["missing title", { ...clone(sampleCase), title: 7 }],
    ["turnLimit as text", { ...clone(sampleCase), turnLimit: "16" }],
    ["slots not an array", { ...clone(sampleCase), slots: {} }],
    ["suspects not an array", { ...clone(sampleCase), suspects: "ada" }],
    ["evidence not an array", { ...clone(sampleCase), evidence: null }],
    ["truth missing", { ...clone(sampleCase), truth: undefined }],
    ["culprit missing", { ...clone(sampleCase), truth: { summary: "", facts: {} } }],
    ["facts not an object", { ...clone(sampleCase), truth: { culprit: "ada", summary: "", facts: [] } }],
    ["slot without values", { ...clone(sampleCase), slots: [{ id: "x" }] }],
    ["value without aliases", { ...clone(sampleCase), slots: [{ id: "x", values: { a: { label: "a" } } }] }],
    ["suspect without rules", { ...clone(sampleCase), suspects: [{ id: "ada", forbidden: [] }] }],
    ["suspect without forbidden", { ...clone(sampleCase), suspects: [{ id: "ada", rules: [] }] }],
    ["rule without cover", { ...clone(sampleCase), suspects: [{ id: "ada", forbidden: [], rules: [{ slot: "ada.where", truth: "study", admitAfter: [] }] }] }],
    ["rule without admitAfter", { ...clone(sampleCase), suspects: [{ id: "ada", forbidden: [], rules: [{ slot: "ada.where", cover: "terrace", truth: "study" }] }] }],
    ["evidence without fixes", { ...clone(sampleCase), evidence: [{ id: "ev" }] }],
    ["fix without value", { ...clone(sampleCase), evidence: [{ id: "ev", fixes: [{ slot: "ada.where" }] }] }],
  ];
  it.each(bad)("%s", (_n, input) => {
    const shape = checkShape(input);
    expect(shape.length).toBeGreaterThan(0);
    expect(shape.every((i) => i.code === "SHAPE")).toBe(true);
    expect(checkCase(input).ok).toBe(false);
  });
});

describe("broken references are caught", () => {
  for (const [name, c] of all) {
    c.suspects.forEach((s, si) =>
      s.rules.forEach((r, ri) => {
        it(`${name}: ${s.id} rule on ${r.slot} naming a missing slot`, () => {
          const m = clone(c);
          m.suspects[si].rules[ri].slot = "nobody.nowhere";
          expect(codes(m)).toContain("UNKNOWN_SLOT");
        });
        it(`${name}: ${s.id} rule on ${r.slot} with a missing cover value`, () => {
          const m = clone(c);
          m.suspects[si].rules[ri].cover = "not_a_value";
          expect(codes(m)).toContain("UNKNOWN_VALUE");
        });
        it(`${name}: ${s.id} rule on ${r.slot} with a missing truth value`, () => {
          const m = clone(c);
          m.suspects[si].rules[ri].truth = "not_a_value";
          expect(codes(m)).toContain("UNKNOWN_VALUE");
        });
        it(`${name}: ${s.id} rule on ${r.slot} unlocking on missing evidence`, () => {
          const m = clone(c);
          m.suspects[si].rules[ri].admitAfter = ["ev-does-not-exist"];
          expect(codes(m)).toContain("UNKNOWN_EVIDENCE");
        });
      }),
    );
    c.evidence.forEach((e, ei) =>
      e.fixes.forEach((f, fi) => {
        it(`${name}: ${e.id} fixing a missing slot`, () => {
          const m = clone(c);
          m.evidence[ei].fixes[fi].slot = "nobody.nowhere";
          expect(codes(m)).toContain("UNKNOWN_SLOT");
        });
        it(`${name}: ${e.id} fixing ${f.slot} to a missing value`, () => {
          const m = clone(c);
          m.evidence[ei].fixes[fi].value = "not_a_value";
          expect(codes(m)).toContain("UNKNOWN_VALUE");
        });
      }),
    );
    it(`${name}: a culprit who is not a suspect`, () => {
      const m = clone(c);
      m.truth.culprit = "the-butler";
      expect(codes(m)).toContain("UNKNOWN_CULPRIT");
    });
    for (const k of Object.keys(c.truth.facts)) {
      it(`${name}: truth fact ${k} with a missing value`, () => {
        const m = clone(c);
        m.truth.facts[k] = "not_a_value";
        expect(codes(m)).toContain("UNKNOWN_VALUE");
      });
    }
    it(`${name}: truth fact on a missing slot`, () => {
      const m = clone(c);
      m.truth.facts["nobody.nowhere"] = "x";
      expect(codes(m)).toContain("UNKNOWN_SLOT");
    });
  }
});

describe("duplicate ids are caught", () => {
  for (const [name, c] of all) {
    c.suspects.forEach((s, i) =>
      it(`${name}: suspect ${s.id} twice`, () => {
        const m = clone(c);
        m.suspects.push(clone(m.suspects[i]));
        expect(codes(m)).toContain("DUPLICATE_ID");
      }),
    );
    c.evidence.forEach((e, i) =>
      it(`${name}: evidence ${e.id} twice`, () => {
        const m = clone(c);
        m.evidence.push(clone(m.evidence[i]));
        expect(codes(m)).toContain("DUPLICATE_ID");
      }),
    );
    c.slots.forEach((s, i) =>
      it(`${name}: slot ${s.id} twice`, () => {
        const m = clone(c);
        m.slots.push(clone(m.slots[i]));
        expect(codes(m)).toContain("DUPLICATE_ID");
      }),
    );
  }
});

describe("evidence that disagrees with the truth is caught", () => {
  for (const [name, c] of all) {
    c.evidence.forEach((e, ei) =>
      e.fixes.forEach((f, fi) => {
        const slot = c.slots.find((s) => s.id === f.slot)!;
        for (const other of Object.keys(slot.values).filter((v) => v !== f.value)) {
          it(`${name}: ${e.id} claiming ${f.slot}=${other}`, () => {
            const m = clone(c);
            m.evidence[ei].fixes[fi].value = other;
            const cs = codes(m);
            expect(cs.some((x) => x === "FACT_MISMATCH" || x === "HONEST_CONTRADICTED")).toBe(true);
            expect(checkCase(m).ok).toBe(false);
          });
        }
      }),
    );
    c.suspects.forEach((s, si) =>
      s.rules.forEach((r, ri) => {
        if (!(r.slot in c.truth.facts)) return;
        const slot = c.slots.find((x) => x.id === r.slot)!;
        for (const other of Object.keys(slot.values).filter((v) => v !== r.truth)) {
          it(`${name}: the truth file saying ${r.slot}=${other} while ${s.id}'s rule says ${r.truth}`, () => {
            const m = clone(c);
            m.truth.facts[r.slot] = other;
            expect(codes(m)).toContain("FACT_MISMATCH");
          });
        }
        void si;
        void ri;
      }),
    );
  }
});

describe("a case that cannot be won is caught", () => {
  for (const [name, c] of all) {
    const thief = c.suspects.findIndex((s) => s.id === c.truth.culprit);
    it(`${name}: removing every piece of evidence against the thief`, () => {
      const m = clone(c);
      const lieSlots = new Set(m.suspects[thief].rules.filter((r) => r.cover !== r.truth).map((r) => r.slot));
      for (const e of m.evidence) e.fixes = e.fixes.filter((f) => !lieSlots.has(f.slot));
      expect(codes(m)).toContain("NO_PROVABLE_LIE");
    });
    it(`${name}: a thief who never lies`, () => {
      const m = clone(c);
      for (const r of m.suspects[thief].rules) r.cover = r.truth;
      const cs = codes(m);
      expect(cs).toContain("NO_PROVABLE_LIE");
    });
    c.suspects[thief].rules.forEach((r, ri) => {
      if (r.cover === r.truth) return;
      it(`${name}: the thief can never admit ${r.slot}`, () => {
        const m = clone(c);
        m.suspects[thief].rules[ri].admitAfter = [];
        expect(codes(m)).toContain("LIE_NEVER_ADMITTED");
      });
    });
    c.suspects.forEach((s) => {
      if (s.id === c.truth.culprit) return;
      it(`${name}: naming innocent ${s.id} as the thief`, () => {
        const m = clone(c);
        m.truth.culprit = s.id;
        // Either the innocent has no provable lie, or the version is still consistent; it must never crash.
        const r = checkCase(m);
        expect(r.culprit).toBe(s.id);
        if (!r.provableLies.some((l) => l.suspectId === s.id)) expect(r.issues.map((i) => i.code)).toContain("NO_PROVABLE_LIE");
      });
    });
  }
});

describe("an honest answer is never proven false", () => {
  for (const [name, c] of all) {
    c.suspects.forEach((s) =>
      s.rules.forEach((r) => {
        if (r.cover !== r.truth) return;
        const slot = c.slots.find((x) => x.id === r.slot)!;
        for (const other of Object.keys(slot.values).filter((v) => v !== r.truth)) {
          it(`${name}: evidence "proving" honest ${s.id} lied about ${r.slot}`, () => {
            const m = clone(c);
            m.evidence.push({ id: "ev-planted", title: "Planted", lines: [], image: null, fixes: [{ slot: r.slot, value: other }] });
            expect(codes(m)).toContain("HONEST_CONTRADICTED");
          });
        }
      }),
    );
  }
});

describe("a forbidden word that is also the suspect's alibi is caught", () => {
  for (const [name, c] of all) {
    c.suspects.forEach((s, si) =>
      s.rules.forEach((r) => {
        const v = c.slots.find((x) => x.id === r.slot)!.values[r.cover];
        for (const word of [v.label, ...v.aliases]) {
          it(`${name}: forbidding ${s.id} from saying "${word}"`, () => {
            const m = clone(c);
            m.suspects[si].forbidden.push(word);
            expect(codes(m)).toContain("FORBIDDEN_IS_COVER");
          });
        }
      }),
    );
  }
});

describe("turn limits", () => {
  const cases: [number, boolean][] = [
    [0, false],
    [1, false],
    [3, false],
    [4, true],
    [10, true],
    [24, true],
    [200, true],
    [201, false],
    [12.5, false],
    [-5, false],
  ];
  it.each(cases)("a limit of %s is %s", (n, ok) => {
    const m = clone(sampleCase);
    m.turnLimit = n;
    const cs = codes(m);
    expect(cs.includes("TURN_LIMIT")).toBe(!ok);
  });

  it("a case with one suspect is refused", () => {
    const m = clone(sampleCase);
    m.suspects = [m.suspects[0]];
    m.slots = [m.slots[0]];
    m.evidence = [m.evidence[0]];
    m.truth.facts = { "ada.where": "study" };
    expect(codes(m)).toContain<IssueCode>("TOO_FEW_SUSPECTS");
  });

  it("two suspects owning the same slot are refused", () => {
    const m = clone(sampleCase);
    m.suspects[1].rules.push({ slot: "ada.where", cover: "terrace", truth: "terrace", admitAfter: [] });
    expect(codes(m)).toContain("SLOT_OWNED_TWICE");
  });
});
