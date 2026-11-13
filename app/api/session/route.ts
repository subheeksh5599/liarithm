import { after, NextResponse } from "next/server";
import { getCase, publicCase } from "@/lib/cases";
import { fail, HttpError } from "@/lib/api";
import { newSession } from "@/lib/session";
import { warmBrains } from "@/lib/models";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { caseId } = (await req.json().catch(() => ({}))) as { caseId?: string };
    const c = getCase(String(caseId ?? ""));
    if (!c) throw new HttpError(404, "Case not found.");
    const { token, commit, session } = newSession(c);
    after(() => warmBrains(c).catch(() => {}));
    return NextResponse.json({ token, commit, startedAt: session.startedAt, case: publicCase(c) });
  } catch (e) {
    return fail(e);
  }
}
