import { NextRequest, NextResponse } from "next/server";

// API routes are server-only; skip the dynamic export during a static export.
if (process.env.STATIC_EXPORT !== "true" && process.env.GITHUB_PAGES !== "true") {
  (exports as Record<string, unknown>).dynamic = "force-dynamic";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lon = parseFloat(searchParams.get("lon") || "0");

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const reverseUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(reverseUrl, { next: { revalidate: 3600 } });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        name: data.locality || data.city || data.principalSubdivision || "Target Location",
        country: data.countryName || "",
        countryCode: data.countryCode || "",
        latitude: lat,
        longitude: lon,
        region: data.principalSubdivision || "",
      });
    }

    return NextResponse.json({
      name: `Lat ${lat.toFixed(2)}°, Lon ${lon.toFixed(2)}°`,
      country: "Global Coordinate",
      latitude: lat,
      longitude: lon,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        name: "Coordinate",
        country: "Global",
        error: message,
      },
      { status: 200 }
    );
  }
}
