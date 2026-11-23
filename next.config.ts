import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Two independent root layouts live in route groups: (boxes) and (urban-mark).
    globalNotFound: true,
  },
};

export default nextConfig;
