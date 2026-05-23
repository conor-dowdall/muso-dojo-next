import { type NextConfig } from "next";

const allowedDevOrigins =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : undefined;

const nextConfig: NextConfig = {
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
