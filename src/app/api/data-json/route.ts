import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// API routes are server-only; skip the dynamic export during a static export.
if (process.env.STATIC_EXPORT !== "true" && process.env.GITHUB_PAGES !== "true") {
  (exports as Record<string, unknown>).dynamic = "force-dynamic";
}

const DATA_FILE_PATH = path.join(process.cwd(), "data.json");

export async function GET() {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return NextResponse.json({ error: "data.json not found" }, { status: 404 });
    }
    const content = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let existing: Record<string, unknown> = {};
    if (fs.existsSync(DATA_FILE_PATH)) {
      try {
        existing = JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf-8"));
      } catch (_) {
        existing = {};
      }
    }
    const merged = {
      ...existing,
      ...body,
      preferences: {
        ...(typeof existing.preferences === "object" ? existing.preferences : {}),
        ...(typeof body.preferences === "object" ? body.preferences : {}),
      },
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
