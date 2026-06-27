import { NextResponse } from "next/server";
import { checkAllSources } from "@/lib/sources";

export const dynamic = "force-dynamic";

export async function GET() {
  const sources = await checkAllSources();
  const summary = {
    totaal: sources.length,
    ok: sources.filter((s) => s.ok).length,
    rws: sources.filter((s) => s.type === "rws"),
    voorspelling: sources.filter((s) => s.type === "forecast"),
  };

  return NextResponse.json({ syncedAt: new Date().toISOString(), summary, sources });
}
