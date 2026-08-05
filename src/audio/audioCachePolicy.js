export const AUDIO_ASSET_URL_PREFIX = "/audio/";
export const DEFAULT_AUDIO_PRECACHE_EXTENSION = ".ogg";
export const WAV_AUDIO_RUNTIME_CACHE_NAME = "audio-sample-packs-wav-v1";
export const SERWIST_DEFAULT_AUDIO_RUNTIME_CACHE_NAME = "static-audio-assets";
export const LEGACY_AUDIO_RUNTIME_CACHE_NAMES = Object.freeze([
  "audio-sample-packs-v1",
  SERWIST_DEFAULT_AUDIO_RUNTIME_CACHE_NAME,
]);

/**
 * Serwist's Next.js configurator applies user manifest transforms before it
 * rebases files from `public/` to root-relative URLs. Normalize both shapes so
 * the audio policy is independent of that transform order.
 *
 * @param {string} url
 */
export function normalizePrecacheManifestUrl(url) {
  const publicRelativeUrl = url.startsWith("public/")
    ? url.slice("public".length)
    : url;

  return publicRelativeUrl.startsWith("/")
    ? publicRelativeUrl
    : `/${publicRelativeUrl}`;
}

/** @param {string} url */
export function isAudioPrecacheManifestEntry(url) {
  return normalizePrecacheManifestUrl(url).startsWith(AUDIO_ASSET_URL_PREFIX);
}

/** @param {string} url */
export function shouldPrecacheAudioManifestEntry(url) {
  const normalizedUrl = normalizePrecacheManifestUrl(url);

  return (
    normalizedUrl.startsWith(AUDIO_ASSET_URL_PREFIX) &&
    normalizedUrl.endsWith(DEFAULT_AUDIO_PRECACHE_EXTENSION)
  );
}

/** @param {string} pathname */
export function isWavAudioRuntimeCachePath(pathname) {
  return (
    pathname.startsWith(AUDIO_ASSET_URL_PREFIX) && pathname.endsWith(".wav")
  );
}
