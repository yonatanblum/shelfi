import type { NextConfig } from "next";

const SHELF_IMAGE_UPLOAD_LIMIT = "10mb";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: SHELF_IMAGE_UPLOAD_LIMIT,
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
