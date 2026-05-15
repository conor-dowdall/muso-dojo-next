import { type NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const allowedDevOrigins =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : undefined;

const nextConfig: NextConfig = {
  /* config options here */
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
  basePath,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
