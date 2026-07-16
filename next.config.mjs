/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the dashboard is fully client-side (it reads a JSON eval
  // run), so it builds to a static site that can be hosted anywhere —
  // GitHub Pages, S3, Netlify — with no server.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
