import { NextRequest, NextResponse } from "next/server";

// API routes are server-only; skip the dynamic export during a static export.
if (process.env.STATIC_EXPORT !== "true" && process.env.GITHUB_PAGES !== "true") {
  (exports as Record<string, unknown>).dynamic = "force-dynamic";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=10&language=en&format=json`;

    const res = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "WeatherClimateAnalytics/1.0",
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}
