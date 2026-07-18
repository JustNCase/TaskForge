import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskforge/ai-core", "@taskforge/ui", "@taskforge/database"],
  serverExternalPackages: ["stripe", "openai"],
  experimental: {
    optimizePackageImports: ["@taskforge/ai-core", "@taskforge/ui"],
  },
};

export default nextConfig;
