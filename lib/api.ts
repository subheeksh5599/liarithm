// Shared plumbing for the API routes.

import { NextResponse } from "next/server";
import { getCase } from "./cases";
import { ConfigError, UpstreamError } from "./models";
import { unseal, verifyLog } from "./session";
import type { CaseFile, LogEntry } from "./types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function fail(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof ConfigError) return NextResponse.json({ error: err.message, kind: "config" }, { status: 503 });
  if (err instanceof UpstreamError) {
    const hint = err.status === 402 ? `${err.service} has no credit left.` : err.status === 429 ? `${err.service} is rate-limiting; ask again in a moment.` : `${err.service} did not answer.`;
    return NextResponse.json({ error: hint, detail: err.message, kind: "upstream" }, { status: 502 });
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("SESSION_SECRET")) return NextResponse.json({ error: msg, kind: "config" }, { status: 503 });
  return NextResponse.json({ error: "Something broke on the server.", detail: msg }, { status: 500 });
}

/** Opens the sealed session, loads its case and checks the testimony log the player sent back. */
export function openSession(token: unknown, log: unknown): { sid: string; salt: string; c: CaseFile; log: LogEntry[] } {
  if (typeof token !== "string") throw new HttpError(400, "Missing session token.");
  let s;
  try {
    s = unseal(token);
  } catch (e) {
    if (e instanceof Error && e.message.includes("SESSION_SECRET")) throw e;
    throw new HttpError(401, "This session token is not valid. Start the case again.");
  }
  const c = getCase(s.caseId);
  if (!c) throw new HttpError(404, "Case not found.");
  const entries = Array.isArray(log) ? (log as LogEntry[]) : [];
  const v = verifyLog(s.sid, entries);
  if (!v.ok) throw new HttpError(409, `The testimony log was altered (${v.error}). Start the case again.`);
  return { sid: s.sid, salt: s.salt, c, log: entries };
}

export function shownTo(log: LogEntry[], suspectId: string): string[] {
  return Array.from(new Set(log.filter((e) => e.suspectId === suspectId && e.evidence).map((e) => e.evidence as string)));
}

export function shownAll(log: LogEntry[]): string[] {
  return Array.from(new Set(log.filter((e) => e.evidence).map((e) => e.evidence as string)));
}
