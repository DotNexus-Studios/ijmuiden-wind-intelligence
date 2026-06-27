import { fetchFusedRealtimeWind } from "@/lib/fusion/service";
import { TARGET_LOCATION } from "@/lib/config/location";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const fused = await fetchFusedRealtimeWind();
    return NextResponse.json(
      { target: TARGET_LOCATION, ...fused },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fusion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
