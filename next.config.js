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
  // Proxy /api/* requests to backend - eliminates CORS issues
  // Browser sees same-origin requests, Next.js server forwards to ngrok backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
