import {
  normalizeRootNoteString,
  rootNoteToIntegerMap,
} from "@musodojo/music-theory-data";
import { isPlayableMidiNote } from "@/audio/pitch";
import {
  DEFAULT_DRONE_OCTAVE,
  DRONE_OCTAVE_MAX,
  DRONE_OCTAVE_MIN,
} from "@/utils/drone/droneDefaults";
import { DEFAULT_PART_ROOT_NOTE } from "@/utils/session/sessionDefaults";

export interface ResolvedDronePitch {
  label: string;
  midi: number;
  octave: number;
  rootNote: string;
}

export function normalizeDroneOctave(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_DRONE_OCTAVE;
  }

  return Math.min(
    Math.max(Math.round(value), DRONE_OCTAVE_MIN),
    DRONE_OCTAVE_MAX,
  );
}

export function resolveDronePitch({
  rootNote,
  octave,
}: {
  rootNote: string | undefined;
  octave: unknown;
}): ResolvedDronePitch {
  const normalizedRootNote =
    (typeof rootNote === "string" && normalizeRootNoteString(rootNote)) ||
    DEFAULT_PART_ROOT_NOTE;
  const pitchClass =
    rootNoteToIntegerMap.get(normalizedRootNote) ??
    rootNoteToIntegerMap.get(DEFAULT_PART_ROOT_NOTE) ??
    0;
  const resolvedOctave = normalizeDroneOctave(octave);
  const midi = (resolvedOctave + 1) * 12 + pitchClass;

  return {
    label: `${normalizedRootNote}${resolvedOctave}`,
    midi: isPlayableMidiNote(midi) ? midi : 60,
    octave: resolvedOctave,
    rootNote: normalizedRootNote,
  };
}
