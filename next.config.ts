import type { NextConfig } from "next";

// Detect static export mode. Set GITHUB_PAGES=true (or PAGES_BASE_PATH=<name>)
// when building for GitHub Pages project sites, which serve from a subpath.
const isStaticExport = process.env.STATIC_EXPORT === "true" || process.env.GITHUB_PAGES === "true";
const basePath = process.env.GITHUB_PAGES === "true"
  ? (process.env.BASE_PATH ? `/${process.env.BASE_PATH}` : "")
  : undefined;

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  trailingSlash: isStaticExport ? true : undefined,
  basePath,
  images: {
    // Static export cannot use the Next.js image optimizer.
    unoptimized: isStaticExport,
  },
  // The Express/Next API routes are not part of a static export. The client
  // detects the absence of a backend and runs fully client-side.
  skipProxyUrlNormalize: isStaticExport,
  pageExtensions: ["tsx", "ts", "jsx", "js"],
};

export default nextConfig;
