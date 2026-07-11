import { type MusicPartConfig, type PartModuleConfig } from "@/types/session";
import { normalizePartDurationInBars } from "@/utils/music-part/partDuration";
import {
  DEFAULT_PART_LENGTH_BEATS,
  normalizePartLengthBeats,
} from "@/utils/music-part/partLength";
import { normalizePartBandConfig } from "@/utils/music-part/partBand";
import { normalizePartModuleConfig } from "@/utils/session/normalizePartModuleConfig";
import {
  ensureUniqueIds,
  isRecord,
  normalizeId,
  normalizeNoteCollectionKey,
  normalizeOptionalBoolean,
  normalizeRootNote,
} from "@/utils/session/normalizationPrimitives";

export function normalizeMusicPartConfig(
  value: unknown,
  index = 0,
): MusicPartConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const modules = ensureUniqueIds(
    Array.isArray(value.modules)
      ? value.modules
          .map((module, moduleIndex) =>
            normalizePartModuleConfig(module, moduleIndex),
          )
          .filter((module): module is PartModuleConfig => Boolean(module))
      : [],
  );
  const showHeader = normalizeOptionalBoolean(value.showHeader, true);
  const durationInBars = normalizePartDurationInBars(value.durationInBars);
  const migratedLengthBeats =
    durationInBars !== undefined
      ? durationInBars * DEFAULT_PART_LENGTH_BEATS
      : DEFAULT_PART_LENGTH_BEATS;
  const lengthBeats =
    normalizePartLengthBeats(value.lengthBeats) ??
    normalizePartLengthBeats(migratedLengthBeats) ??
    DEFAULT_PART_LENGTH_BEATS;
  const automaticRhythm =
    value.automaticRhythm === "swing" ? "swing" : "standard";
  const band = normalizePartBandConfig(value.band, modules);
  const lengthMode =
    value.lengthMode === "rhythm" && band.rhythm.mode === "module"
      ? "rhythm"
      : "fixed";

  return {
    id: normalizeId(value.id, `part-${index + 1}`),
    rootNote: normalizeRootNote(value.rootNote),
    noteCollectionKey: normalizeNoteCollectionKey(value.noteCollectionKey),
    lengthBeats,
    lengthMode,
    band,
    automaticRhythm,
    ...(durationInBars !== undefined ? { durationInBars } : {}),
    ...(showHeader !== undefined ? { showHeader } : {}),
    modules,
  };
}
