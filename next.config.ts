import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@musodojo/music-theory-data"],
  reactCompiler: true,
};

export default nextConfig;
