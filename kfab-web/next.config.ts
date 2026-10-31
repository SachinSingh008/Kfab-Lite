import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const fallbackList = [];
    if (process.env.BACKEND_API_URL) {
      fallbackList.push({
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_API_URL}/api/v1/:path*`,
      });
    }
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/inventory',
          destination: '/',
        },
        {
          source: '/workbooks',
          destination: '/',
        },
        {
          source: '/Salary and Advance/:path*',
          destination: '/database/Salary and Advance/:path*',
        },
        {
          source: '/Attendence/:path*',
          destination: '/database/Attendence/:path*',
        },
        {
          source: '/Employee Details/:path*',
          destination: '/database/Employee Details/:path*',
        },
        {
          source: '/Expenses/:path*',
          destination: '/database/Expenses/:path*',
        },
        {
          source: '/Inventory/:path*',
          destination: '/database/Inventory/:path*',
        },
        {
          source: '/Outward Register/:path*',
          destination: '/database/Outward Register/:path*',
        },
        {
          source: '/Sales/:path*',
          destination: '/database/Sales/:path*',
        },
        {
          source: '/others/:path*',
          destination: '/database/others/:path*',
        },
      ],
      fallback: fallbackList,
    };
  },
};

export default nextConfig;
