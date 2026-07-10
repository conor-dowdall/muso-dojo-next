import { type MusicPartConfig, type PartModuleConfig } from "@/types/session";
import { normalizePartDurationInBars } from "@/utils/music-part/partDuration";
import {
  DEFAULT_PART_LENGTH_BEATS,
  normalizePartLengthBeats,
} from "@/utils/music-part/partLength";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { isRhythmPartModule } from "@/utils/session/partModuleTypes";
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

  const modules = Array.isArray(value.modules)
    ? value.modules
        .map((module, moduleIndex) =>
          normalizePartModuleConfig(module, moduleIndex),
        )
        .filter((module): module is PartModuleConfig => Boolean(module))
    : [];
  const showHeader = normalizeOptionalBoolean(value.showHeader, true);
  const durationInBars = normalizePartDurationInBars(value.durationInBars);
  const legacyRhythm = modules.find(isRhythmPartModule);
  const migratedLengthBeats =
    durationInBars !== undefined
      ? durationInBars * DEFAULT_PART_LENGTH_BEATS
      : legacyRhythm
        ? getRhythmSelectionRecipe(legacyRhythm.rhythm).beats
        : DEFAULT_PART_LENGTH_BEATS;
  const lengthBeats =
    normalizePartLengthBeats(value.lengthBeats) ??
    normalizePartLengthBeats(migratedLengthBeats) ??
    DEFAULT_PART_LENGTH_BEATS;
  const automaticRhythm =
    value.automaticRhythm === "swing" ? "swing" : "standard";

  return {
    id: normalizeId(value.id, `part-${index + 1}`),
    rootNote: normalizeRootNote(value.rootNote),
    noteCollectionKey: normalizeNoteCollectionKey(value.noteCollectionKey),
    lengthBeats,
    automaticRhythm,
    ...(durationInBars !== undefined ? { durationInBars } : {}),
    ...(showHeader !== undefined ? { showHeader } : {}),
    modules: ensureUniqueIds(modules),
  };
}
