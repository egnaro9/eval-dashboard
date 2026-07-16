// GitHub Pages serves a project site from /<repo>, so assets need a basePath.
// Local dev and tests run at the root, so it's opt-in via env var and the
// deploy workflow is the only thing that sets it.
const basePath = process.env.PAGES_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the dashboard is fully client-side (it reads a JSON eval
  // run), so it builds to a static site that can be hosted anywhere —
  // GitHub Pages, S3, Netlify — with no server.
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
