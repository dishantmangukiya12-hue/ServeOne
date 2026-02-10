import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-router-dom": path.resolve(__dirname, "lib/react-router-dom.tsx"),
    };
    return config;
  },
};

export default nextConfig;
