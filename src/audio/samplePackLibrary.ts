import { DEFAULT_CONCERT_PITCH_HZ } from "./pitch";
import { samplePacks } from "./samplePacks.generated";
import { type SamplePackId } from "./types";

type SamplePackDeliveryFormat = "wav" | "ogg";
type SamplePackAssetKey = `${SamplePackId}:${string}`;

interface SamplePackAssetRequest {
  key: SamplePackAssetKey;
  pack: SamplePack;
  url: string;
}

type SamplePackWithDeliveryUrls = SamplePack & {
  deliveryFormat?: SamplePackDeliveryFormat;
  urls?: Partial<Record<SamplePackDeliveryFormat, string>>;
};

export const SAMPLE_PACK_IDS = Object.keys(samplePacks) as SamplePackId[];

export type SamplePack = (typeof samplePacks)[SamplePackId];
export type SampleRegion = SamplePack["regions"][number];

export interface LoadedSamplePack {
  buffer: AudioBuffer;
  pack: SamplePack;
}

const samplePackAssets = new Map<SamplePackAssetKey, ArrayBuffer>();
const loadingSamplePackAssets = new Map<
  SamplePackAssetKey,
  Promise<ArrayBuffer | undefined>
>();
const SAMPLE_PACK_AUDIO_FORMAT_QUERY_KEYS = [
  "audioFormat",
  "sampleFormat",
  "audio",
] as const;

export function getSamplePackIdFromUnknown(value: unknown): SamplePackId {
  return SAMPLE_PACK_IDS.includes(value as SamplePackId)
    ? (value as SamplePackId)
    : "piano";
}

export function getConcertPitchHz(concertPitchHz: number | undefined) {
  return concertPitchHz && Number.isFinite(concertPitchHz)
    ? concertPitchHz
    : DEFAULT_CONCERT_PITCH_HZ;
}

export function getPlaybackRate({
  concertPitchHz,
  midiNote,
  region,
}: {
  concertPitchHz: number;
  midiNote: number;
  region: SampleRegion;
}) {
  const concertPitchCents =
    1200 * Math.log2(concertPitchHz / DEFAULT_CONCERT_PITCH_HZ);

  return 2 ** ((midiNote * 100 + concertPitchCents - region.rootCents) / 1200);
}

export function getRegionEndSeconds(region: SampleRegion) {
  return region.offsetSeconds + region.durationSeconds;
}

export function getLoopStartSeconds(region: SampleRegion) {
  return "loopStartSeconds" in region ? region.loopStartSeconds : undefined;
}

export function getLoopEndSeconds(region: SampleRegion) {
  return "loopEndSeconds" in region ? region.loopEndSeconds : undefined;
}

export function regionHasLoop(region: SampleRegion) {
  const loopStartSeconds = getLoopStartSeconds(region);
  const loopEndSeconds = getLoopEndSeconds(region);

  return (
    loopStartSeconds !== undefined &&
    loopEndSeconds !== undefined &&
    loopEndSeconds > loopStartSeconds &&
    loopStartSeconds >= region.offsetSeconds &&
    loopEndSeconds <= getRegionEndSeconds(region) + 0.001
  );
}

export function getRegionForMidi(pack: SamplePack, midiNote: number) {
  return (
    pack.regions.find(
      (region) => midiNote >= region.lowMidi && midiNote <= region.highMidi,
    ) ??
    pack.regions.reduce((closest, region) =>
      Math.abs(region.rootMidi - midiNote) <
      Math.abs(closest.rootMidi - midiNote)
        ? region
        : closest,
    )
  );
}

function isSamplePackDeliveryFormat(
  value: string | null | undefined,
): value is SamplePackDeliveryFormat {
  return value === "wav" || value === "ogg";
}

function getRequestedSamplePackDeliveryFormat() {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const search = (window as Partial<Window>).location?.search ?? "";
    const params = new URLSearchParams(search);

    for (const key of SAMPLE_PACK_AUDIO_FORMAT_QUERY_KEYS) {
      const value = params.get(key)?.toLowerCase();

      if (!value) {
        continue;
      }

      if (value === "default" || value === "auto") {
        return undefined;
      }

      if (isSamplePackDeliveryFormat(value)) {
        return value;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function getDefaultSamplePackDeliveryFormat(pack: SamplePack) {
  const deliveryPack = pack as SamplePackWithDeliveryUrls;

  if (isSamplePackDeliveryFormat(deliveryPack.deliveryFormat)) {
    return deliveryPack.deliveryFormat;
  }

  return pack.url.endsWith(".ogg") ? "ogg" : "wav";
}

function getSamplePackUrlForFormat(
  pack: SamplePack,
  format: SamplePackDeliveryFormat,
) {
  const deliveryPack = pack as SamplePackWithDeliveryUrls;
  return deliveryPack.urls?.[format];
}

function getSamplePackAssetRequest(
  packId: SamplePackId,
): SamplePackAssetRequest {
  const pack = samplePacks[packId];
  const defaultFormat = getDefaultSamplePackDeliveryFormat(pack);
  const requestedFormat = getRequestedSamplePackDeliveryFormat();
  const selectedFormat =
    requestedFormat && getSamplePackUrlForFormat(pack, requestedFormat)
      ? requestedFormat
      : defaultFormat;
  const url = getSamplePackUrlForFormat(pack, selectedFormat) ?? pack.url;

  return {
    key: `${packId}:${url}` as SamplePackAssetKey,
    pack,
    url,
  };
}

export function getSamplePackAssetUrl(packId: SamplePackId) {
  return getSamplePackAssetRequest(packId).url;
}

export function getScheduledOffset({
  context,
  loop,
  playbackRate,
  region,
  startTime,
}: {
  context: AudioContext;
  loop: boolean;
  playbackRate: number;
  region: SampleRegion;
  startTime: number;
}) {
  const lateBufferSeconds =
    Math.max(0, context.currentTime - startTime) * playbackRate;
  const regionEndSeconds = getRegionEndSeconds(region);

  if (!loop) {
    const offsetSeconds = region.offsetSeconds + lateBufferSeconds;

    return offsetSeconds < regionEndSeconds ? offsetSeconds : undefined;
  }

  const loopStartSeconds = getLoopStartSeconds(region);
  const loopEndSeconds = getLoopEndSeconds(region);

  if (loopStartSeconds === undefined || loopEndSeconds === undefined) {
    return region.offsetSeconds;
  }

  const preLoopSeconds = loopStartSeconds - region.offsetSeconds;

  if (lateBufferSeconds <= preLoopSeconds) {
    return region.offsetSeconds + lateBufferSeconds;
  }

  const loopDurationSeconds = loopEndSeconds - loopStartSeconds;
  const loopOffsetSeconds =
    (lateBufferSeconds - preLoopSeconds) % loopDurationSeconds;

  return loopStartSeconds + loopOffsetSeconds;
}

export function loadSamplePackAsset(packId: SamplePackId) {
  return loadSamplePackAssetRequest(getSamplePackAssetRequest(packId));
}

function loadSamplePackAssetRequest(request: SamplePackAssetRequest) {
  const cached = samplePackAssets.get(request.key);

  if (cached) {
    return Promise.resolve(cached);
  }

  const loading = loadingSamplePackAssets.get(request.key);

  if (loading) {
    return loading;
  }

  if (typeof fetch === "undefined") {
    return Promise.resolve(undefined);
  }

  const loadPromise = fetch(request.url)
    .then((response) => (response.ok ? response.arrayBuffer() : undefined))
    .then((arrayBuffer) => {
      if (arrayBuffer) {
        samplePackAssets.set(request.key, arrayBuffer);
      }

      return arrayBuffer;
    })
    .catch(() => undefined)
    .finally(() => {
      loadingSamplePackAssets.delete(request.key);
    });

  loadingSamplePackAssets.set(request.key, loadPromise);
  return loadPromise;
}

export function preloadSamplePackAssets() {
  return Promise.all(
    SAMPLE_PACK_IDS.map((packId) => loadSamplePackAsset(packId)),
  ).then(() => undefined);
}

function releaseSamplePackAsset(key: SamplePackAssetKey) {
  samplePackAssets.delete(key);
}

export function clearSamplePackAssetCacheForTests() {
  samplePackAssets.clear();
  loadingSamplePackAssets.clear();
}

export function createSamplePackLoader() {
  const loadedPacks = new Map<SamplePackAssetKey, LoadedSamplePack>();
  const loadingPacks = new Map<
    SamplePackAssetKey,
    Promise<LoadedSamplePack | undefined>
  >();

  const loadSamplePack = async (
    audioContext: BaseAudioContext,
    packId: SamplePackId,
  ) => {
    const request = getSamplePackAssetRequest(packId);
    const loaded = loadedPacks.get(request.key);

    if (loaded) {
      return loaded;
    }

    const loading = loadingPacks.get(request.key);

    if (loading) {
      return loading;
    }

    const loadPromise = loadSamplePackAssetRequest(request)
      .then((arrayBuffer) =>
        arrayBuffer
          ? audioContext.decodeAudioData(arrayBuffer.slice(0))
          : undefined,
      )
      .then((buffer) => {
        if (!buffer) {
          return undefined;
        }

        const loadedPack = { buffer, pack: request.pack };
        loadedPacks.set(request.key, loadedPack);
        releaseSamplePackAsset(request.key);
        return loadedPack;
      })
      .catch(() => undefined)
      .finally(() => {
        loadingPacks.delete(request.key);
      });

    loadingPacks.set(request.key, loadPromise);
    return loadPromise;
  };

  return {
    getLoadedSamplePack: (packId: SamplePackId) =>
      loadedPacks.get(getSamplePackAssetRequest(packId).key),
    loadSamplePack,
  };
}
