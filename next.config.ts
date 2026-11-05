import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiGatewayUrl =
      process.env.INTERNAL_API_URL ||
      process.env.API_GATEWAY_URL ||
      "http://api-gateway:8080";

    return [
      {
        source: "/api/:path*",
        destination: `${apiGatewayUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
