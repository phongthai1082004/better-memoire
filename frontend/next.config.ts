import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Photography is served from /public/images. Add remotePatterns here when
    // the asset pipeline moves to Cloudflare R2 / Images.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
