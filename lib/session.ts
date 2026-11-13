// Sessions without a database: the truth's salt rides in an encrypted token the player holds,
// and every testimony entry is hash-chained and signed so the log can't be edited client-side.

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CaseFile, Claim, LogEntry } from "./types";

function secret(): Buffer {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET is not set (32+ characters required).");
  return createHash("sha256").update(s).digest();
}

/** Stable JSON: keys sorted at every level, so the same object always hashes the same. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** What the fingerprint commits to. The browser rebuilds this exact string at the reveal. */
export function truthPayload(c: CaseFile) {
  return canonical({ caseId: c.id, culprit: c.truth.culprit, facts: c.truth.facts, summary: c.truth.summary });
}

export function commitment(c: CaseFile, salt: string) {
  return sha256(`${truthPayload(c)}|${salt}`);
}

export interface Session {
  sid: string;
  caseId: string;
  salt: string;
  startedAt: string;
}

export function seal(s: Session): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(s), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function unseal(token: string): Session {
  const raw = Buffer.from(token, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", secret(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  const out = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  return JSON.parse(out) as Session;
}

export function newSession(c: CaseFile): { token: string; session: Session; commit: string } {
  const session: Session = { sid: randomBytes(9).toString("base64url"), caseId: c.id, salt: randomBytes(16).toString("hex"), startedAt: new Date().toISOString() };
  return { token: seal(session), session, commit: commitment(c, session.salt) };
}

const sign = (sid: string, hash: string) => createHmac("sha256", secret()).update(`${sid}|${hash}`).digest("hex");

export function appendEntry(
  sid: string,
  log: LogEntry[],
  e: { suspectId: string; question: string; evidence: string | null; line: string; claims: Claim[]; guarded: boolean; voice: string },
): LogEntry {
  const prev = log.length ? log[log.length - 1].hash : "genesis";
  const base = { i: log.length, suspectId: e.suspectId, question: e.question, evidence: e.evidence, line: e.line, claims: e.claims, guarded: e.guarded, voice: e.voice, at: new Date().toISOString(), prev };
  const hash = sha256(canonical(base));
  return { ...base, hash, sig: sign(sid, hash) };
}

/** Rejects a log that was reordered, edited, truncated in the middle, or not signed for this session. */
export function verifyLog(sid: string, log: LogEntry[]): { ok: boolean; error?: string } {
  let prev = "genesis";
  for (let k = 0; k < log.length; k++) {
    const { hash, sig, ...base } = log[k];
    if (base.i !== k) return { ok: false, error: `entry ${k}: wrong index` };
    if (base.prev !== prev) return { ok: false, error: `entry ${k}: chain broken` };
    if (sha256(canonical(base)) !== hash) return { ok: false, error: `entry ${k}: edited` };
    const want = Buffer.from(sign(sid, hash), "hex");
    const got = Buffer.from(sig ?? "", "hex");
    if (want.length !== got.length || !timingSafeEqual(want, got)) return { ok: false, error: `entry ${k}: bad signature` };
    prev = hash;
  }
  return { ok: true };
}
