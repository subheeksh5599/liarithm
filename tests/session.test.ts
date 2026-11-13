import { beforeAll, describe, expect, it } from "vitest";
import { blackDiamond as c } from "@/lib/cases/black-diamond";
import { appendEntry, commitment, newSession, sha256, truthPayload, unseal, verifyLog } from "@/lib/session";
import type { LogEntry } from "@/lib/types";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-only-for-the-test-suite-0123456789";
});

const say = (log: LogEntry[], line: string) => appendEntry("sid-1", log, { suspectId: "kai", question: "Where were you?", evidence: null, line, claims: [{ slot: "kai.where", value: "maple_cafe" }], guarded: false, voice: "Dolphin" });

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
