import { db } from "@/db";
import { sql } from "drizzle-orm";

// API routes are server-only; skip the dynamic export during a static export.
if (process.env.STATIC_EXPORT !== "true" && process.env.GITHUB_PAGES !== "true") {
  (exports as Record<string, unknown>).dynamic = "force-dynamic";
}

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
