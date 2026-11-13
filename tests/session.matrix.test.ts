import { beforeAll, describe, expect, it } from "vitest";
import { blackDiamondVariants } from "@/lib/cases/black-diamond";
import { drawCase, getCase, variantCount, publicCase } from "@/lib/cases";
import { brainSystemPrompt, cleanLine, voiceSystemPrompt } from "@/lib/models";
import { appendEntry, canonical, commitment, newSession, seal, truthPayload, unseal, verifyLog } from "@/lib/session";
import type { LogEntry, Move } from "@/lib/types";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-only-for-the-test-suite-0123456789";
});

const move = (claims: Move["claims"], m: Move["move"] = "deny"): Move => ({ move: m, claims, tone: "calm", intent: "Keep the story straight." });

describe("drawing a thief", () => {
  it("there are four versions of case 01", () => {
    expect(variantCount("black-diamond")).toBe(4);
  });

  it("an unknown case draws nothing", () => {
    expect(drawCase("nope")).toBeNull();
    expect(getCase("nope")).toBeNull();
  });

  it.each([0, 1, 2, 3])("version %i reopens to the same thief", (v) => {
    expect(getCase("black-diamond", v)!.truth.culprit).toBe(blackDiamondVariants[v].truth.culprit);
  });

  it("an out-of-range version opens nothing", () => {
    expect(getCase("black-diamond", 9)).toBeNull();
  });

  it("2,000 draws reach every thief, each roughly a quarter of the time", () => {
    const n: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const d = drawCase("black-diamond")!;
      n[d.c.truth.culprit] = (n[d.c.truth.culprit] ?? 0) + 1;
    }
    expect(Object.keys(n).sort()).toEqual(["jin", "kai", "ren", "sora"]);
    for (const k of Object.keys(n)) expect(n[k]).toBeGreaterThan(380);
  });
});

describe("what the player's browser receives", () => {
  for (const v of blackDiamondVariants) {
    const pub = JSON.stringify(publicCase(v));
    it(`version ${v.truth.culprit}: no secret is sent`, () => {
      for (const s of v.suspects) expect(pub).not.toContain(s.secret);
    });
    it(`version ${v.truth.culprit}: the answer is not sent`, () => {
      expect(pub).not.toContain(v.truth.summary);
      expect(pub).not.toContain('"culprit"');
      expect(pub).not.toContain('"truth"');
    });
    it(`version ${v.truth.culprit}: no rule, cover or forbidden list is sent`, () => {
      expect(pub).not.toContain('"rules"');
      expect(pub).not.toContain('"forbidden"');
      expect(pub).not.toContain('"admitAfter"');
    });
    it(`version ${v.truth.culprit}: no personality notes that could hint at the thief are sent`, () => {
      for (const s of v.suspects) {
        expect(pub).not.toContain(s.manner);
        expect(pub).not.toContain(s.broken);
      }
    });
  }
});

describe("what each model is told", () => {
  for (const v of blackDiamondVariants) {
    for (const s of v.suspects) {
      const tag = `${v.truth.culprit} version, ${s.id}`;
      const brain = brainSystemPrompt(v, s.id);

      it(`${tag}: the brain knows this suspect's secret`, () => {
        expect(brain).toContain(s.secret);
      });
      it(`${tag}: the brain never sees another suspect's secret`, () => {
        for (const o of v.suspects.filter((x) => x.id !== s.id)) expect(brain).not.toContain(o.secret);
      });
      it(`${tag}: the brain never sees the full answer`, () => {
        expect(brain).not.toContain(v.truth.summary);
      });
      it(`${tag}: the brain prompt is the same every time, so SERV can cache it`, () => {
        expect(brainSystemPrompt(v, s.id)).toBe(brain);
      });

      const deny = move(s.rules.map((r) => ({ slot: r.slot, value: r.cover })));
      const voice = voiceSystemPrompt(v, s.id, deny, null);
      it(`${tag}: the voice never sees the secret`, () => {
        expect(voice).not.toContain(s.secret);
      });
      it(`${tag}: the voice never sees the answer`, () => {
        expect(voice).not.toContain(v.truth.summary);
      });
      for (const r of s.rules.filter((x) => x.cover !== x.truth)) {
        const truth = v.slots.find((x) => x.id === r.slot)!.values[r.truth].label;
        it(`${tag}: while denying, the voice is not handed the true ${r.slot} ("${truth}")`, () => {
          expect(voice).not.toContain(`: ${truth}`);
        });
        it(`${tag}: when admitting ${r.slot}, the voice gets exactly the admitted fact`, () => {
          const admit = voiceSystemPrompt(v, s.id, move([{ slot: r.slot, value: r.truth }], "partial_admit"), null);
          expect(admit).toContain(truth);
          expect(admit).toContain(s.broken);
        });
      }
      it(`${tag}: a rejected line is fed back on retry`, () => {
        expect(voiceSystemPrompt(v, s.id, deny, 'named "pier 9"')).toContain('named "pier 9"');
      });
      it(`${tag}: no claim means no facts`, () => {
        expect(voiceSystemPrompt(v, s.id, move([], "answer"), null)).toContain("make no factual claim");
      });
    }
  }
});

describe("cleaning a spoken line", () => {
  const cases: [string, string][] = [
    ["<think>plan</think>I was at the café.", "I was at the café."],
    ['"I was at the café."', "I was at the café."],
    ["  I was at the café.  ", "I was at the café."],
  ];
  it.each(cases)("%j becomes %j", (raw, clean) => {
    expect(cleanLine(raw)).toBe(clean);
  });
});

describe("the sealed session", () => {
  for (const [v, c] of blackDiamondVariants.entries()) {
    it(`version ${v} round-trips through the sealed token`, () => {
      const { token, session } = newSession(c, v);
      expect(unseal(token)).toEqual(session);
    });
    it(`version ${v}: the player cannot read the version from the token`, () => {
      const { token } = newSession(c, v);
      expect(Buffer.from(token, "base64url").toString("utf8")).not.toContain('"variant"');
    });
  }

  const { token } = (() => {
    process.env.SESSION_SECRET = "test-secret-only-for-the-test-suite-0123456789";
    return newSession(blackDiamondVariants[0], 0);
  })();
  const raw = Buffer.from(token, "base64url");
  const positions = Array.from({ length: 48 }, (_, i) => Math.floor((i * (raw.length - 1)) / 47));
  it.each(positions)("flipping byte %i of the token is refused", (p) => {
    const b = Buffer.from(raw);
    b[p] ^= 0x01;
    expect(() => unseal(b.toString("base64url"))).toThrow();
  });

  it("a token sealed with another secret is refused", () => {
    const t = seal({ sid: "x", caseId: "black-diamond", variant: 1, salt: "s", startedAt: "now" });
    process.env.SESSION_SECRET = "a-completely-different-secret-for-this-one-test";
    try {
      expect(() => unseal(t)).toThrow();
    } finally {
      process.env.SESSION_SECRET = "test-secret-only-for-the-test-suite-0123456789";
    }
  });
});

describe("the truth fingerprint", () => {
  const salts = ["a", "b", "0".repeat(32), "f".repeat(32)];
  for (const [i, c] of blackDiamondVariants.entries()) {
    for (const salt of salts) {
      it(`version ${i}, salt ${salt.slice(0, 4)}: re-hashing gives the same fingerprint`, () => {
        expect(commitment(c, salt)).toBe(commitment(structuredClone(c), salt));
      });
    }
    it(`version ${i}: the payload names this version's thief`, () => {
      expect(JSON.parse(truthPayload(c)).culprit).toBe(c.truth.culprit);
    });
  }

  it("all sixteen (version, salt) fingerprints differ", () => {
    const set = new Set(blackDiamondVariants.flatMap((c) => salts.map((s) => commitment(c, s))));
    expect(set.size).toBe(16);
  });

  const edits: [string, (c: (typeof blackDiamondVariants)[0]) => void][] = [
    ["the thief", (c) => (c.truth.culprit = "nobody")],
    ["the summary", (c) => (c.truth.summary += " ")],
    ["one fact", (c) => (c.truth.facts["ren.where"] = "harbor_office")],
    ["an added fact", (c) => (c.truth.facts["extra"] = "x")],
  ];
  it.each(edits)("changing %s changes the fingerprint", (_n, edit) => {
    const c = structuredClone(blackDiamondVariants[0]);
    const before = commitment(c, "salt");
    edit(c);
    expect(commitment(c, "salt")).not.toBe(before);
  });

  const orders: [string, unknown, unknown][] = [
    ["object keys", { a: 1, b: 2 }, { b: 2, a: 1 }],
    ["nested keys", { x: { a: 1, b: [1, 2] } }, { x: { b: [1, 2], a: 1 } }],
  ];
  it.each(orders)("canonical form ignores %s order", (_n, a, b) => {
    expect(canonical(a)).toBe(canonical(b));
  });
  it("canonical form keeps array order", () => {
    expect(canonical([1, 2])).not.toBe(canonical([2, 1]));
  });
});

describe("the signed testimony log", () => {
  const sid = "sid-matrix";
  const build = (n: number) => {
    const log: LogEntry[] = [];
    for (let i = 0; i < n; i++)
      log.push(appendEntry(sid, log, { suspectId: i % 2 ? "jin" : "kai", question: `q${i}`, evidence: i === 2 ? "ev-cctv" : null, line: `line ${i}`, claims: [{ slot: "kai.where", value: "maple_cafe" }], guarded: false, brain: "SERV", voice: "SERV" }));
    return log;
  };

  it.each([1, 2, 5, 10])("an untouched chain of %i lines verifies", (n) => {
    expect(verifyLog(sid, build(n)).ok).toBe(true);
  });

  const fields: [string, (e: LogEntry) => void][] = [
    ["question", (e) => (e.question += "?")],
    ["line", (e) => (e.line = "I confess.")],
    ["claims", (e) => (e.claims = [{ slot: "kai.where", value: "dockyard" }])],
    ["suspect", (e) => (e.suspectId = "ren")],
    ["evidence", (e) => (e.evidence = "ev-phone")],
    ["time", (e) => (e.at = "2026-01-01T00:00:00.000Z")],
    ["guard flag", (e) => (e.guarded = !e.guarded)],
    ["brain", (e) => (e.brain = "someone else")],
    ["voice", (e) => (e.voice = "someone else")],
    ["previous hash", (e) => (e.prev = "0".repeat(64))],
    ["hash", (e) => (e.hash = "0".repeat(64))],
    ["signature", (e) => (e.sig = "0".repeat(64))],
    ["index", (e) => (e.i += 1)],
  ];
  for (let at = 0; at < 5; at++) {
    for (const [field, edit] of fields) {
      it(`editing the ${field} of line ${at + 1} of 5 is caught`, () => {
        const log = build(5);
        edit(log[at]);
        expect(verifyLog(sid, log).ok).toBe(false);
      });
    }
  }

  it("dropping a line from the middle is caught", () => {
    const log = build(5);
    log.splice(2, 1);
    expect(verifyLog(sid, log).ok).toBe(false);
  });
  it("swapping two lines is caught", () => {
    const log = build(5);
    [log[1], log[2]] = [log[2], log[1]];
    expect(verifyLog(sid, log).ok).toBe(false);
  });
  it("a log signed for another session is refused", () => {
    expect(verifyLog("another-session", build(3)).ok).toBe(false);
  });
  it("an empty log verifies", () => {
    expect(verifyLog(sid, []).ok).toBe(true);
  });
});
