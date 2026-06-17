import { DEFAULT_CONCERT_PITCH_HZ } from "./pitch";
import { samplePacks } from "./samplePacks.generated";
import { type SamplePackId } from "./types";

export const SAMPLE_PACK_IDS = Object.keys(samplePacks) as SamplePackId[];

export type SamplePack = (typeof samplePacks)[SamplePackId];
export type SampleRegion = SamplePack["regions"][number];

export interface LoadedSamplePack {
  buffer: AudioBuffer;
  pack: SamplePack;
}

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

export function createSamplePackLoader() {
  const loadedPacks = new Map<SamplePackId, LoadedSamplePack>();
  const loadingPacks = new Map<
    SamplePackId,
    Promise<LoadedSamplePack | undefined>
  >();

  const loadSamplePack = async (
    audioContext: AudioContext,
    packId: SamplePackId,
  ) => {
    const loaded = loadedPacks.get(packId);

    if (loaded) {
      return loaded;
    }

    const loading = loadingPacks.get(packId);

    if (loading) {
      return loading;
    }

    const pack = samplePacks[packId];
    const loadPromise = fetch(pack.url)
      .then((response) => (response.ok ? response.arrayBuffer() : undefined))
      .then((arrayBuffer) =>
        arrayBuffer
          ? audioContext.decodeAudioData(arrayBuffer.slice(0))
          : undefined,
      )
      .then((buffer) => {
        if (!buffer) {
          return undefined;
        }

        const loadedPack = { buffer, pack };
        loadedPacks.set(packId, loadedPack);
        return loadedPack;
      })
      .catch(() => undefined)
      .finally(() => {
        loadingPacks.delete(packId);
      });

    loadingPacks.set(packId, loadPromise);
    return loadPromise;
  };

  return {
    getLoadedSamplePack: (packId: SamplePackId) => loadedPacks.get(packId),
    loadSamplePack,
  };
}
