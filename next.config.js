/** @type {import('next').NextConfig} */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://kampungilmu-be-production.up.railway.app";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Proxy /backend/* requests to backend - use /backend prefix to avoid
  // conflict with Vercel's reserved /api path for serverless functions
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
