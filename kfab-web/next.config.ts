import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
