import { NextResponse } from "next/server";
import { fail, HttpError, openSession, shownAll, shownTo } from "@/lib/api";
import { findContradictions } from "@/lib/referee";
import { runTurn, TurnRefused } from "@/lib/turn";
import { appendEntry } from "@/lib/session";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { sid, c, log } = openSession(body.token, body.log);
    const suspectId = String(body.suspectId ?? "");
    if (!c.suspects.some((s) => s.id === suspectId)) throw new HttpError(400, "Unknown suspect.");
    const evidence = body.evidence ? String(body.evidence) : null;
    if (evidence && !c.evidence.some((e) => e.id === evidence)) throw new HttpError(400, "Unknown evidence.");
    const ev = evidence ? c.evidence.find((e) => e.id === evidence)! : null;
    const question = String(body.question ?? "").trim().slice(0, 500) || (ev ? `Look at this: ${ev.title}.` : "");
    if (!question) throw new HttpError(400, "Ask something.");
    if (log.length >= c.turnLimit) throw new HttpError(409, "No turns left. Make your accusation.");

    const shown = Array.from(new Set([...shownTo(log, suspectId), ...(evidence ? [evidence] : [])]));
    let turn;
    try {
      turn = await runTurn(c, suspectId, question, evidence, shown, log);
    } catch (e) {
      if (e instanceof TurnRefused) throw new HttpError(502, e.message);
      throw e;
    }

    const entry = appendEntry(sid, log, { suspectId, question, evidence, line: turn.line, claims: turn.claims, guarded: turn.guarded, brain: turn.brain, voice: turn.voice });
    const full = [...log, entry];
    const contradictions = findContradictions(c, full, shownAll(full));

    return NextResponse.json({
      entry,
      move: { move: turn.move.move, tone: turn.move.tone },
      guarded: turn.guarded,
      droppedClaims: turn.droppedClaims,
      rejectedLines: turn.rejectedLines.length,
      voice: turn.voice,
      brain: turn.brain,
      contradictions,
      turnsLeft: c.turnLimit - full.length,
    });
  } catch (e) {
    return fail(e);
  }
}
