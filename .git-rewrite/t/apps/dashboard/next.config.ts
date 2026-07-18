import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskforge/ai-core", "@taskforge/ui", "@taskforge/database"],
};

export default nextConfig;
