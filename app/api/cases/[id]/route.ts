import { NextResponse } from "next/server";
import { blackDiamondVariants } from "@/lib/cases/black-diamond";

/** The authored source of a case, every version, so studios can load it into the checker as an example. */
const sources: Record<string, unknown[]> = { "black-diamond": blackDiamondVariants };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const src = sources[id];
  if (!src) return NextResponse.json({ error: "Case not found." }, { status: 404 });
  return NextResponse.json(src);
}
