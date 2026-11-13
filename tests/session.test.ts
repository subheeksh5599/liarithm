import { beforeAll, describe, expect, it } from "vitest";
import { blackDiamond as c } from "@/lib/cases/black-diamond";
import { appendEntry, commitment, newSession, sha256, truthPayload, unseal, verifyLog } from "@/lib/session";
import type { LogEntry } from "@/lib/types";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-only-for-the-test-suite-0123456789";
});

const say = (log: LogEntry[], line: string) => appendEntry("sid-1", log, { suspectId: "kai", question: "Where were you?", evidence: null, line, claims: [{ slot: "kai.where", value: "maple_cafe" }], guarded: false, brain: "SERV", voice: "SERV" });

describe("the truth fingerprint", () => {
  it("commits to the truth plus a per-session salt, and re-hashes to the same value", () => {
    const { token, commit } = newSession(c);
    const s = unseal(token);
    expect(sha256(`${truthPayload(c)}|${s.salt}`)).toBe(commit);
    expect(commitment(c, s.salt)).toBe(commit);
  });

  it("gives every session a different fingerprint", () => {
    expect(newSession(c).commit).not.toBe(newSession(c).commit);
  });

  it("changes if the culprit changes", () => {
    const salt = "abc";
    const swapped = { ...c, truth: { ...c.truth, culprit: "jin" } };
    expect(commitment(swapped, salt)).not.toBe(commitment(c, salt));
  });

  it("refuses a tampered session token", () => {
    const { token } = newSession(c);
    const bad = token.slice(0, -2) + (token.endsWith("A") ? "BB" : "AA");
    expect(() => unseal(bad)).toThrow();
  });
});

describe("the random thief", () => {
  it("has a version for every suspect, each committing to a different truth", async () => {
    const { blackDiamondVariants } = await import("@/lib/cases/black-diamond");
    const culprits = blackDiamondVariants.map((v) => v.truth.culprit).sort();
    expect(culprits).toEqual(["jin", "kai", "ren", "sora"]);
    const commits = new Set(blackDiamondVariants.map((v) => commitment(v, "same-salt")));
    expect(commits.size).toBe(4);
  });

  it("seals the drawn version into the session and reopens the same one", async () => {
    const { getCase } = await import("@/lib/cases");
    const { blackDiamondVariants } = await import("@/lib/cases/black-diamond");
    const { token, commit } = newSession(blackDiamondVariants[2], 2);
    const s = unseal(token);
    const reopened = getCase(s.caseId, s.variant)!;
    expect(reopened.truth.culprit).toBe("jin");
    expect(commitment(reopened, s.salt)).toBe(commit);
  });

  it("every version is solvable: evidence proves a lie by the thief", async () => {
    const { blackDiamondVariants } = await import("@/lib/cases/black-diamond");
    for (const v of blackDiamondVariants) {
      const thief = v.suspects.find((s) => s.id === v.truth.culprit)!;
      const lies = thief.rules.filter((r) => r.cover !== r.truth);
      expect(lies.length).toBeGreaterThan(0);
      for (const r of lies) {
        for (const evId of r.admitAfter) {
          const ev = v.evidence.find((e) => e.id === evId)!;
          expect(ev, `${v.truth.culprit}: ${evId}`).toBeTruthy();
        }
        expect(v.evidence.some((e) => e.fixes.some((f) => f.slot === r.slot && f.value === r.truth))).toBe(true);
      }
      // every slot value referenced exists
      for (const s of v.suspects) for (const r of s.rules) {
        const slot = v.slots.find((x) => x.id === r.slot)!;
        expect(slot.values[r.cover] && slot.values[r.truth], `${s.id} ${r.slot}`).toBeTruthy();
      }
    }
  });
});

describe("the testimony log", () => {
  it("accepts an untouched chain", () => {
    const a = say([], "I was at the café.");
    const b = say([a], "Still the café.");
    expect(verifyLog("sid-1", [a, b]).ok).toBe(true);
  });

  it("refuses an edited line", () => {
    const a = say([], "I was at the café.");
    expect(verifyLog("sid-1", [{ ...a, line: "I was at the docks." }]).ok).toBe(false);
  });

  it("refuses edited claims", () => {
    const a = say([], "I was at the café.");
    expect(verifyLog("sid-1", [{ ...a, claims: [] }]).ok).toBe(false);
  });

  it("refuses a log signed for another session", () => {
    const a = say([], "I was at the café.");
    expect(verifyLog("sid-2", [a]).ok).toBe(false);
  });

  it("refuses a dropped entry in the middle", () => {
    const a = say([], "one");
    const b = say([a], "two");
    const d = say([a, b], "three");
    expect(verifyLog("sid-1", [a, d]).ok).toBe(false);
  });
});
