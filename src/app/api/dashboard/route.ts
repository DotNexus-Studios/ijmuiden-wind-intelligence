import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import type { RiderWeight } from "@/lib/watersport/kite-size";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weight = (searchParams.get("weight") as RiderWeight) ?? "medium";
    const validWeights: RiderWeight[] = ["light", "medium", "heavy"];
    const riderWeight = validWeights.includes(weight) ? weight : "medium";

    const data = await getDashboardData(riderWeight);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboarddata ophalen mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
