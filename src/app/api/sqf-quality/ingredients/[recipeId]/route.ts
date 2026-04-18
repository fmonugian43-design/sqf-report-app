import { NextResponse } from "next/server";

const INVENTORY_API_URL =
  process.env.INVENTORY_API_URL ||
  "https://inventory-app-production-e6b0.up.railway.app";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;

  try {
    const res = await fetch(
      `${INVENTORY_API_URL}/api/external/recipes/${recipeId}/ingredients`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ingredients" },
        { status: 502 }
      );
    }

    const ingredients = await res.json();
    return NextResponse.json(ingredients);
  } catch (err) {
    console.error("Ingredients fetch error:", err);
    return NextResponse.json(
      { error: "Could not connect to inventory app" },
      { status: 502 }
    );
  }
}
