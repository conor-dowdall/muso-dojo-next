import {
  isBeatSubdivisionKey,
  type BeatSubdivisionKey,
} from "@musodojo/music-theory-data";

const legacyBeatSubdivisionKeys: Readonly<Record<string, BeatSubdivisionKey>> =
  {
    quarter: "1-per-beat",
    eighth: "2-per-beat",
    "eighth-triplet": "3-per-beat",
    sixteenth: "4-per-beat",
    quintuplet: "5-per-beat",
    "sixteenth-triplet": "6-per-beat",
    septuplet: "7-per-beat",
    "thirty-second": "8-per-beat",
  };

export function normalizeBeatSubdivisionKey(
  value: unknown,
): BeatSubdivisionKey | undefined {
  if (isBeatSubdivisionKey(value)) {
    return value;
  }

  return typeof value === "string" &&
    Object.hasOwn(legacyBeatSubdivisionKeys, value)
    ? legacyBeatSubdivisionKeys[value]
    : undefined;
}
