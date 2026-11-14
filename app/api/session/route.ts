import { NextResponse } from "next/server";
import { drawCase, publicCase } from "@/lib/cases";
import { fail, HttpError } from "@/lib/api";
import { newSession } from "@/lib/session";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { caseId } = (await req.json().catch(() => ({}))) as { caseId?: string };
    const drawn = drawCase(String(caseId ?? ""));
    if (!drawn) throw new HttpError(404, "Case not found.");
    const { c, variant } = drawn;
    const { token, commit, session } = newSession(c, variant);
    return NextResponse.json({ token, commit, startedAt: session.startedAt, case: publicCase(c) });
  } catch (e) {
    return fail(e);
  }
}
