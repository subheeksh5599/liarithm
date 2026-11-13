import { beforeAll, describe, expect, it } from "vitest";
import { blackDiamond as c } from "@/lib/cases/black-diamond";
import { allowedValues, checkLine, checkMove, findContradictions, judgeAccusation } from "@/lib/referee";
import type { Move } from "@/lib/types";

const move = (claims: Move["claims"], m: Move["move"] = "deny"): Move => ({ move: m, claims, tone: "calm", intent: "x" });

describe("what a suspect may claim", () => {
  it("keeps the truth locked until the unlocking evidence is shown to that suspect", () => {
    expect(allowedValues(c, "kai", [])["kai.where"]).toEqual(["maple_cafe"]);
    expect(allowedValues(c, "kai", ["ev-phone"])["kai.where"]).toEqual(["maple_cafe", "dockyard"]);
  });

  it("does not unlock a fact when unrelated evidence is shown", () => {
    expect(allowedValues(c, "kai", ["ev-bill", "ev-cctv"])["kai.where"]).toEqual(["maple_cafe"]);
  });

  it("refuses a move that claims a locked value", () => {
    const r = checkMove(c, "kai", move([{ slot: "kai.where", value: "dockyard" }]), []);
    expect(r.ok).toBe(false);
  });

  it("refuses a claim about another suspect's slot", () => {
    const r = checkMove(c, "kai", move([{ slot: "jin.where", value: "main_street" }]), []);
    expect(r.ok).toBe(false);
  });

  it("accepts the cover story", () => {
    expect(checkMove(c, "kai", move([{ slot: "kai.where", value: "maple_cafe" }]), []).ok).toBe(true);
  });
});

describe("what a spoken line may say", () => {
  const cover = move([{ slot: "kai.where", value: "maple_cafe" }]);

  it("passes a line that stays inside the move", () => {
    expect(checkLine(c, "kai", "I was at the café. You can check the bill if you want.", cover, []).ok).toBe(true);
  });

  it("catches a forbidden term", () => {
    const r = checkLine(c, "kai", "Fine. It's in locker 14, happy?", cover, []);
    expect(r.ok).toBe(false);
    expect(r.leaks.join()).toContain("locker 14");
  });

  it("catches a locked answer named in passing", () => {
    const r = checkLine(c, "kai", "I took a walk by the docks first, then the café.", cover, []);
    expect(r.ok).toBe(false);
    expect(r.leaks.join()).toContain("kai.where=dockyard");
  });

  it("lets the same words through once the evidence has unlocked them", () => {
    const admit = move([{ slot: "kai.where", value: "dockyard" }], "partial_admit");
    expect(checkLine(c, "kai", "Fine, I walked past the docks. So what?", admit, ["ev-phone"]).ok).toBe(true);
  });

  it("logs only the move's claims, not passing mentions", () => {
    const r = checkLine(c, "kai", "The café makes a decent coffee.", move([]), []);
    expect(r.claims).toEqual([]);
  });
});

describe("proving a lie", () => {
  const log = [
    { i: 0, suspectId: "kai", claims: [{ slot: "kai.where", value: "maple_cafe" }] },
    { i: 1, suspectId: "jin", claims: [{ slot: "jin.where", value: "harbor_office" }] },
  ];

  it("finds the contradiction when the evidence fixes a different value", () => {
    const x = findContradictions(c, log, ["ev-phone"]);
    expect(x).toEqual([{ suspectId: "kai", evidenceId: "ev-phone", slot: "kai.where", claimed: "maple_cafe", proven: "dockyard", entry: 0 }]);
  });

  it("returns nothing for evidence that proves nothing about the claims", () => {
    expect(findContradictions(c, log, ["ev-bill"])).toEqual([]);
  });

  it("does not flag a claim that agrees with the evidence", () => {
    expect(findContradictions(c, [{ i: 0, suspectId: "jin", claims: [{ slot: "jin.where", value: "main_street" }] }], ["ev-cctv"])).toEqual([]);
  });
});

describe("the accusation", () => {
  const kaiLie = [{ suspectId: "kai", evidenceId: "ev-phone", slot: "kai.where", claimed: "maple_cafe", proven: "dockyard", entry: 0 }];
  const jinLie = [{ suspectId: "jin", evidenceId: "ev-cctv", slot: "jin.where", claimed: "harbor_office", proven: "main_street", entry: 1 }];

  it("wins with the right name and a proven lie", () => {
    expect(judgeAccusation(c, "kai", kaiLie).won).toBe(true);
  });

  it("loses with the right name and no proof", () => {
    expect(judgeAccusation(c, "kai", []).won).toBe(false);
  });

  it("loses when the proven liar is not the thief", () => {
    expect(judgeAccusation(c, "jin", jinLie).won).toBe(false);
  });
});
