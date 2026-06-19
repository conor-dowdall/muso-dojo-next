// @ts-check
import crypto from "node:crypto";
import { serwist } from "@serwist/next/config";

const deploymentRevision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  crypto.randomUUID();

const explicitPrecacheUrls = [
  "/",
  "/dojo",
  "/~offline",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
];

const explicitPrecacheSourcePatterns = [
  /^\.next\/server\/(?:app|pages)\/index\.html$/,
  /^\.next\/server\/(?:app|pages)\/dojo\.html$/,
  /^\.next\/server\/(?:app|pages)\/~offline\.html$/,
];

function isExplicitPrecacheEntry(url) {
  return (
    explicitPrecacheUrls.includes(url) ||
    explicitPrecacheSourcePatterns.some((pattern) => pattern.test(url))
  );
}

function isAudioPrecacheEntry(url) {
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

  return normalizedUrl.startsWith("/audio/");
}

export default serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  precachePrerendered: true,
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  manifestTransforms: [
    (manifestEntries) => ({
      manifest: manifestEntries.filter(
        ({ url }) =>
          !isExplicitPrecacheEntry(url) && !isAudioPrecacheEntry(url),
      ),
      warnings: [],
    }),
  ],
  additionalPrecacheEntries: explicitPrecacheUrls.map((url) => ({
    url,
    revision: deploymentRevision,
  })),
});
