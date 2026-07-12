import { type MusicPartConfig } from "@/types/session";
import { type SessionBackingBandConfig } from "@/types/session";
import {
  DEFAULT_PART_LENGTH_BEATS,
  getPerPartRhythmBeats,
  normalizePartLengthBeats,
  resolvePartBackingBand,
  type PartBackingBandInput,
} from "./resolvePartBackingBand";

export {
  DEFAULT_PART_LENGTH_BEATS,
  MAX_PART_LENGTH_BEATS,
  MIN_PART_LENGTH_BEATS,
  normalizePartLengthBeats,
} from "./resolvePartBackingBand";

type PartLengthInput = PartBackingBandInput &
  Pick<MusicPartConfig, "automaticRhythm">;

export function getAutomaticRhythmBeats(part: PartLengthInput) {
  return getPerPartRhythmBeats(part);
}

export function getPartLengthBeats(
  part: PartLengthInput,
  backingBand?: SessionBackingBandConfig,
) {
  return resolvePartBackingBand(part, backingBand).durationBeats;
}

export function formatPartLengthBeats(lengthBeats: number) {
  const normalized = normalizePartLengthBeats(lengthBeats);
  const resolved = normalized ?? DEFAULT_PART_LENGTH_BEATS;
  const label = resolved.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });

  return `${label} ${resolved === 1 ? "Beat" : "Beats"}`;
}
