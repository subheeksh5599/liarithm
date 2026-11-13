import { NextResponse } from "next/server";
import { getCase, publicCase } from "@/lib/cases";
import { fail, HttpError } from "@/lib/api";
import { newSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { caseId } = (await req.json().catch(() => ({}))) as { caseId?: string };
    const c = getCase(String(caseId ?? ""));
    if (!c) throw new HttpError(404, "Case not found.");
    const { token, commit, session } = newSession(c);
    return NextResponse.json({ token, commit, startedAt: session.startedAt, case: publicCase(c) });
  } catch (e) {
    return fail(e);
  }
}
