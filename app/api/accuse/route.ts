import { NextResponse } from "next/server";
import { fail, HttpError, openSession, shownAll } from "@/lib/api";
import { findContradictions, judgeAccusation } from "@/lib/referee";
import { commitment, truthPayload } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { salt, c, log } = openSession(body.token, body.log);
    const accused = String(body.suspectId ?? "");
    if (!c.suspects.some((s) => s.id === accused)) throw new HttpError(400, "Unknown suspect.");
    const contradictions = findContradictions(c, log, shownAll(log));
    const verdict = judgeAccusation(c, accused, contradictions);
    return NextResponse.json({
      verdict,
      contradictions,
      reveal: {
        payload: truthPayload(c),
        salt,
        commit: commitment(c, salt),
        culprit: c.truth.culprit,
        summary: c.truth.summary,
        secrets: c.suspects.map((s) => ({ id: s.id, name: s.name, secret: s.secret })),
      },
    });
  } catch (e) {
    return fail(e);
  }
}
