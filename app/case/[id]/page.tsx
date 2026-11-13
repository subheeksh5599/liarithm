import { notFound } from "next/navigation";
import { getCase, publicCase } from "@/lib/cases";
import Game from "@/components/Game";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) notFound();
  // Evidence differs per drawn version, so the page shell shows none until the session opens.
  return <Game initial={{ ...publicCase(c), evidence: [] }} />;
}
