import { NextResponse } from "next/server";

const INVENTORY_API_URL =
  process.env.INVENTORY_API_URL ||
  "https://inventory-app-production-e6b0.up.railway.app";

export async function GET() {
  try {
    const res = await fetch(`${INVENTORY_API_URL}/api/external/recipes`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 502 }
      );
    }

    const recipes = await res.json();

    // Return ALL active recipes (mix and pack)
    const active = (Array.isArray(recipes) ? recipes : []).filter(
      (r: { active?: boolean }) => r.active !== false
    );

    return NextResponse.json(active);
  } catch (err) {
    console.error("Recipe fetch error:", err);
    return NextResponse.json(
      { error: "Could not connect to inventory app" },
      { status: 502 }
    );
  }
}
