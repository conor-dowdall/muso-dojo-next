/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheExpiration,
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  Serwist,
} from "serwist";
import {
  isWavAudioRuntimeCachePath,
  LEGACY_AUDIO_RUNTIME_CACHE_NAMES,
  SERWIST_DEFAULT_AUDIO_RUNTIME_CACHE_NAME,
  WAV_AUDIO_RUNTIME_CACHE_NAME,
} from "../audio/audioCachePolicy.js";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

async function deleteLegacyAudioRuntimeCaches() {
  await Promise.allSettled(
    LEGACY_AUDIO_RUNTIME_CACHE_NAMES.map(async (cacheName) => {
      await Promise.allSettled([
        self.caches.delete(cacheName),
        new CacheExpiration(cacheName, { maxEntries: 1 }).delete(),
      ]);
    }),
  );
}

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteLegacyAudioRuntimeCaches());
});

const defaultCacheWithoutAudio = defaultCache.filter(
  ({ handler }) =>
    !(
      typeof handler === "object" &&
      handler !== null &&
      "cacheName" in handler &&
      handler.cacheName === SERWIST_DEFAULT_AUDIO_RUNTIME_CACHE_NAME
    ),
);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^icon/, /^apple-icon/],
  },
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Default Ogg packs are owned by the precache route. Keeping this
      // runtime route WAV-only prevents the same Ogg response being stored in
      // both the precache and a second CacheFirst cache.
      matcher({ sameOrigin, url }) {
        return sameOrigin && isWavAudioRuntimeCachePath(url.pathname);
      },
      handler: new CacheFirst({
        cacheName: WAV_AUDIO_RUNTIME_CACHE_NAME,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 24,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    ...defaultCacheWithoutAudio,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
