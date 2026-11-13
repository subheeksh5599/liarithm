import { NextResponse } from "next/server";
import { checkCase, checkVersions } from "@/lib/checker";
import { blackDiamondVariants } from "@/lib/cases/black-diamond";

const MAX_BYTES = 200_000;

/**
 * POST a case file (one object) or every version of a case (an array).
 * Returns the checker's report. Plain code, no model involved, nothing stored.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: `Case files are limited to ${MAX_BYTES / 1000} KB.` }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "That is not valid JSON." }, { status: 400 });
  }
  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > 12) return NextResponse.json({ error: "Send between 1 and 12 versions." }, { status: 400 });
    return NextResponse.json(checkVersions(body));
  }
  const r = checkCase(body);
  return NextResponse.json({ ok: r.ok, versions: [r], issues: [] });
}

/**
 * GET runs the checker on the live game's own case, every version. Only pass/fail and counts come back:
 * the thief and the evidence that convicts them stay secret, so this cannot be used to cheat.
 */
export async function GET() {
  const r = checkVersions(blackDiamondVariants);
  return NextResponse.json({
    ok: r.ok,
    case: "The Black Diamond",
    versions: r.versions.map((v, i) => ({ version: i + 1, ok: v.ok, issues: v.issues.length, provableLies: v.provableLies.length })),
  });
}
