import { describe, expect, it } from "vitest";
import { blackDiamondVariants } from "@/lib/cases/black-diamond";
import { sampleCase } from "@/lib/cases/sample";
import { allowedValues, checkLine, checkMove, findContradictions, judgeAccusation } from "@/lib/referee";
import type { CaseFile, Move } from "@/lib/types";

const move = (claims: Move["claims"], m: Move["move"] = "deny"): Move => ({ move: m, claims, tone: "calm", intent: "x" });
const all: [string, CaseFile][] = [...blackDiamondVariants.map((v) => [`black-diamond/${v.truth.culprit}`, v] as [string, CaseFile]), ["sample", sampleCase]];

describe("what each suspect may claim, rule by rule", () => {
  for (const [name, c] of all) {
    for (const s of c.suspects) {
      for (const r of s.rules) {
        const tag = `${name}: ${s.id} on ${r.slot}`;

        it(`${tag}: before any evidence, only the cover may be claimed`, () => {
          expect(allowedValues(c, s.id, [])[r.slot]).toEqual([r.cover]);
        });

        it(`${tag}: the cover always passes`, () => {
          expect(checkMove(c, s.id, move([{ slot: r.slot, value: r.cover }]), []).ok).toBe(true);
        });

        if (r.cover === r.truth) continue;

        it(`${tag}: the truth is refused while locked`, () => {
          const res = checkMove(c, s.id, move([{ slot: r.slot, value: r.truth }]), []);
          expect(res.ok).toBe(false);
          expect(res.errors[0]).toContain("locked");
        });

        for (const ev of r.admitAfter) {
          it(`${tag}: showing ${ev} unlocks the truth`, () => {
            expect(allowedValues(c, s.id, [ev])[r.slot]).toContain(r.truth);
            expect(checkMove(c, s.id, move([{ slot: r.slot, value: r.truth }], "partial_admit"), [ev]).ok).toBe(true);
          });
          it(`${tag}: after ${ev}, the cover is still allowed`, () => {
            expect(allowedValues(c, s.id, [ev])[r.slot]).toContain(r.cover);
          });
        }

        for (const ev of c.evidence.map((e) => e.id).filter((e) => !r.admitAfter.includes(e))) {
          it(`${tag}: showing unrelated ${ev} keeps the truth locked`, () => {
            expect(allowedValues(c, s.id, [ev])[r.slot]).toEqual([r.cover]);
          });
        }
      }

      for (const other of c.suspects.filter((o) => o.id !== s.id)) {
        for (const r of other.rules) {
          it(`${name}: ${s.id} cannot make claims about ${other.id}'s ${r.slot}`, () => {
            const res = checkMove(c, s.id, move([{ slot: r.slot, value: r.cover }]), []);
            expect(res.ok).toBe(false);
            expect(res.errors[0]).toContain("unknown slot");
          });
        }
      }

      it(`${name}: ${s.id} with no claims always passes`, () => {
        expect(checkMove(c, s.id, move([], "answer"), []).ok).toBe(true);
      });
    }
  }
});

describe("what a spoken line may say", () => {
  for (const [name, c] of all) {
    for (const s of c.suspects) {
      const cover = move(s.rules.map((r) => ({ slot: r.slot, value: r.cover })));

      for (const r of s.rules) {
        const slot = c.slots.find((x) => x.id === r.slot)!;
        for (const [valueId, v] of Object.entries(slot.values)) {
          const locked = valueId !== r.cover && !(r.cover === r.truth && valueId === r.truth);
          for (const alias of v.aliases) {
            const line = `Honestly, detective, ${alias}. That is all.`;
            if (locked) {
              it(`${name}: ${s.id} saying "${alias}" leaks ${r.slot}=${valueId} while it is locked`, () => {
                const res = checkLine(c, s.id, line, cover, []);
                expect(res.ok).toBe(false);
                expect(res.leaks.some((l) => l.includes(`${r.slot}=${valueId}`))).toBe(true);
              });
              const unlockers = valueId === r.truth ? r.admitAfter : [];
              if (unlockers.length) {
                it(`${name}: ${s.id} saying "${alias}" is fine once ${unlockers[0]} was shown`, () => {
                  const res = checkLine(c, s.id, line, cover, [unlockers[0]]);
                  expect(res.leaks.filter((l) => l.includes(`${r.slot}=${valueId}`))).toEqual([]);
                });
              }
            } else {
              it(`${name}: ${s.id} saying "${alias}" is their allowed answer on ${r.slot}`, () => {
                const res = checkLine(c, s.id, line, cover, []);
                expect(res.leaks.filter((l) => l.includes(`${r.slot}=${valueId}`))).toEqual([]);
              });
            }
          }
        }
      }

      for (const f of s.forbidden) {
        const wrappers: [string, string][] = [
          ["plain", f],
          ["shouted", f.toUpperCase()],
          ["mid-sentence", `Look, ${f}, if you must know.`],
          ["with punctuation", `${f}!`],
          ["curly apostrophes", f.replace(/'/g, "’")],
        ];
        for (const [how, line] of wrappers) {
          it(`${name}: ${s.id} saying the forbidden "${f}" (${how}) is caught`, () => {
            const res = checkLine(c, s.id, line, cover, []);
            expect(res.ok).toBe(false);
            expect(res.leaks).toContain(`forbidden: "${f}"`);
          });
        }
        it(`${name}: "${f}" glued inside a longer word is not a match`, () => {
          const res = checkLine(c, s.id, `zz${f.replace(/\s/g, "")}zz`, cover, []);
          expect(res.leaks).not.toContain(`forbidden: "${f}"`);
        });
      }

      it(`${name}: ${s.id}'s logged claims are exactly the move's claims`, () => {
        expect(checkLine(c, s.id, "Fine weather tonight.", cover, []).claims).toEqual(cover.claims);
      });

      it(`${name}: ${s.id} small talk passes`, () => {
        expect(checkLine(c, s.id, "I would like a glass of water, please.", move([], "answer"), []).ok).toBe(true);
      });
    }
  }
});

describe("proving a lie is a comparison", () => {
  for (const [name, c] of all) {
    for (const e of c.evidence) {
      for (const f of e.fixes) {
        const slot = c.slots.find((x) => x.id === f.slot)!;
        const owner = c.suspects.find((s) => s.rules.some((r) => r.slot === f.slot));
        const who = owner?.id ?? "kai";

        it(`${name}: claiming the value ${e.id} proves (${f.slot}=${f.value}) is not a lie`, () => {
          expect(findContradictions(c, [{ i: 0, suspectId: who, claims: [{ slot: f.slot, value: f.value }] }], [e.id])).toEqual([]);
        });

        for (const other of Object.keys(slot.values).filter((v) => v !== f.value)) {
          it(`${name}: claiming ${f.slot}=${other} against ${e.id} is a proven lie`, () => {
            const out = findContradictions(c, [{ i: 3, suspectId: who, claims: [{ slot: f.slot, value: other }] }], [e.id]);
            expect(out).toEqual([{ suspectId: who, evidenceId: e.id, slot: f.slot, claimed: other, proven: f.value, entry: 3 }]);
          });
          it(`${name}: claiming ${f.slot}=${other} is not a lie until ${e.id} is on the table`, () => {
            expect(findContradictions(c, [{ i: 0, suspectId: who, claims: [{ slot: f.slot, value: other }] }], [])).toEqual([]);
          });
          it(`${name}: the same lie told twice counts once per line`, () => {
            const log = [
              { i: 0, suspectId: who, claims: [{ slot: f.slot, value: other }] },
              { i: 1, suspectId: who, claims: [{ slot: f.slot, value: other }] },
            ];
            expect(findContradictions(c, log, [e.id, e.id])).toHaveLength(2);
          });
        }
      }
    }

    it(`${name}: unknown evidence ids prove nothing`, () => {
      const log = c.suspects.flatMap((s, i) => s.rules.map((r) => ({ i, suspectId: s.id, claims: [{ slot: r.slot, value: r.cover }] })));
      expect(findContradictions(c, log, ["ev-nope"])).toEqual([]);
    });

    it(`${name}: every suspect telling their cover story, with all evidence shown, convicts only liars`, () => {
      const log = c.suspects.flatMap((s, i) => s.rules.map((r) => ({ i, suspectId: s.id, claims: [{ slot: r.slot, value: r.cover }] })));
      const out = findContradictions(c, log, c.evidence.map((e) => e.id));
      for (const x of out) {
        const r = c.suspects.find((s) => s.id === x.suspectId)!.rules.find((rr) => rr.slot === x.slot)!;
        expect(r.cover).not.toBe(r.truth);
      }
      expect(out.some((x) => x.suspectId === c.truth.culprit)).toBe(true);
    });
  }
});

describe("the verdict", () => {
  for (const [name, c] of all) {
    for (const s of c.suspects) {
      const thief = s.id === c.truth.culprit;
      const lie = { suspectId: s.id, evidenceId: "ev", slot: "x", claimed: "a", proven: "b", entry: 0 };
      it(`${name}: accusing ${s.id} with a proven lie`, () => {
        const v = judgeAccusation(c, s.id, [lie]);
        expect(v.correct).toBe(thief);
        expect(v.proven).toBe(true);
        expect(v.won).toBe(thief);
      });
      it(`${name}: accusing ${s.id} without one`, () => {
        const v = judgeAccusation(c, s.id, []);
        expect(v.correct).toBe(thief);
        expect(v.proven).toBe(false);
        expect(v.won).toBe(false);
      });
      it(`${name}: accusing ${s.id} holding only someone else's lie`, () => {
        const other = c.suspects.find((o) => o.id !== s.id)!.id;
        const v = judgeAccusation(c, s.id, [{ ...lie, suspectId: other }]);
        expect(v.proven).toBe(false);
        expect(v.won).toBe(false);
      });
    }
  }
});

describe("each version can be won the way a player would", () => {
  for (const [name, c] of all) {
    it(`${name}: the thief tells their cover, the evidence is shown, the accusation wins`, () => {
      const thief = c.suspects.find((s) => s.id === c.truth.culprit)!;
      const r = thief.rules.find((x) => x.cover !== x.truth && c.evidence.some((e) => e.fixes.some((f) => f.slot === x.slot && f.value === x.truth)))!;
      const ev = c.evidence.find((e) => e.fixes.some((f) => f.slot === r.slot && f.value === r.truth))!;
      expect(checkMove(c, thief.id, move([{ slot: r.slot, value: r.cover }]), []).ok).toBe(true);
      const lies = findContradictions(c, [{ i: 0, suspectId: thief.id, claims: [{ slot: r.slot, value: r.cover }] }], [ev.id]);
      expect(judgeAccusation(c, thief.id, lies).won).toBe(true);
    });
  }
});
