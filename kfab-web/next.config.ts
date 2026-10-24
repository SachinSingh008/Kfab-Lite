import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (!process.env.BACKEND_API_URL) {
      return [];
    }
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.BACKEND_API_URL}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
