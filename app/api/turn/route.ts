import { NextResponse } from "next/server";
import { fail, HttpError, openSession, shownAll, shownTo } from "@/lib/api";
import { decideMove, phraseWithBrain, speakLine } from "@/lib/models";
import { checkLine, checkMove, findContradictions } from "@/lib/referee";
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
    const askedWithEvidence = ev ? `${question}\n[The detective shows you: ${ev.title}. ${ev.lines.join(". ")}]` : question;

    // 1. Brain decides the move.
    const brain = await decideMove(c, suspectId, askedWithEvidence, shown, evidence, log);
    const moveCheck = checkMove(c, suspectId, brain.move, shown);
    if (!moveCheck.ok) {
      // A move outside the rules is never voiced. Keep only the claims that pass on their own.
      brain.move.claims = brain.move.claims.filter((cl) => checkMove(c, suspectId, { ...brain.move, claims: [cl] }, shown).ok);
    }

    // 2. Voice speaks it; 3. referee checks the line. Two retries, then the brain phrases it.
    const attempts: { line: string; leaks: string[] }[] = [];
    let line = "";
    let voice = "";
    let lineCheck = null;
    for (let k = 0; k < 3; k++) {
      const note = attempts.length ? attempts[attempts.length - 1].leaks.join("; ") : null;
      const spoken = await speakLine(c, suspectId, askedWithEvidence, brain.move, log, note);
      lineCheck = checkLine(c, suspectId, spoken.line, brain.move, shown);
      if (lineCheck.ok && spoken.line) {
        line = spoken.line;
        voice = spoken.voice;
        break;
      }
      attempts.push({ line: spoken.line, leaks: lineCheck.leaks.length ? lineCheck.leaks : ["empty line"] });
    }
    if (!line) {
      const phrased = await phraseWithBrain(c, suspectId, askedWithEvidence, brain.move);
      lineCheck = checkLine(c, suspectId, phrased, brain.move, shown);
      if (!lineCheck.ok) throw new HttpError(502, "They hesitate. Ask again.");
      line = phrased;
      voice = "SERV (rephrased)";
    }

    const entry = appendEntry(sid, log, { suspectId, question, evidence, line, claims: lineCheck!.claims, guarded: brain.guarded, voice });
    const full = [...log, entry];
    const contradictions = findContradictions(c, full, shownAll(full));

    return NextResponse.json({
      entry,
      move: { move: brain.move.move, tone: brain.move.tone },
      guarded: brain.guarded,
      droppedClaims: moveCheck.ok ? [] : moveCheck.errors,
      rejectedLines: attempts.length,
      voice,
      contradictions,
      turnsLeft: c.turnLimit - full.length,
    });
  } catch (e) {
    return fail(e);
  }
}
