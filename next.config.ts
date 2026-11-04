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
};

export default nextConfig;
