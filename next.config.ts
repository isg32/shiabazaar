import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shiabazaar.com",
      },
    ],
  },
};

export default nextConfig;
