import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
    resolveAlias: {
      "react-router-dom": "./lib/react-router-dom.tsx",
    },
  },
};

export default nextConfig;
