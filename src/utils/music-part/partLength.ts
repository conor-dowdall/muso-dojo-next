import { type MusicPartConfig } from "@/types/session";

export const DEFAULT_PART_LENGTH_BEATS = 4;
export const MIN_PART_LENGTH_BEATS = 0.125;
export const MAX_PART_LENGTH_BEATS = 128;
export const USER_PART_LENGTH_BEAT_CHOICES = Array.from(
  { length: 16 },
  (_, index) => index + 1,
);

const PART_LENGTH_PRECISION = 1_000_000;

function roundPartLength(value: number) {
  return Math.round(value * PART_LENGTH_PRECISION) / PART_LENGTH_PRECISION;
}

export function normalizePartLengthBeats(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < MIN_PART_LENGTH_BEATS ||
    value > MAX_PART_LENGTH_BEATS
  ) {
    return undefined;
  }

  return roundPartLength(value);
}

export function getPartLengthBeats(
  part: Partial<Pick<MusicPartConfig, "durationInBars" | "lengthBeats">>,
) {
  return (
    normalizePartLengthBeats(part.lengthBeats) ??
    normalizePartLengthBeats(
      part.durationInBars === undefined
        ? undefined
        : part.durationInBars * DEFAULT_PART_LENGTH_BEATS,
    ) ??
    DEFAULT_PART_LENGTH_BEATS
  );
}

export function formatPartLengthBeats(lengthBeats: number) {
  const normalized = normalizePartLengthBeats(lengthBeats);
  const resolved = normalized ?? DEFAULT_PART_LENGTH_BEATS;
  const label = resolved.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });

  return `${label} ${resolved === 1 ? "Beat" : "Beats"}`;
}
