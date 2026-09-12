import type { Metadata } from "next";

// In static-export mode, `redirect()` cannot run on the server. We emit a
// meta-refresh redirect page instead so the static root forwards to the
// standalone dashboard (index.html) at /index.html.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "New Climate — Redirecting",
};

export default function HomePage() {
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0; url=./index.html" />
      </head>
      <body>
        <p>Redirecting to the New Climate dashboard…</p>
      </body>
    </html>
  );
}
