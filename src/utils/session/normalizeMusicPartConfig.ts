import { type MusicPartConfig, type PartModuleConfig } from "@/types/session";
import { normalizePartDurationInBars } from "@/utils/music-part/partDuration";
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
  const automaticRhythmValue = isRecord(value.automaticRhythm)
    ? value.automaticRhythm
    : undefined;
  const automaticRhythm = {
    style:
      value.automaticRhythm === "swing" ||
      automaticRhythmValue?.style === "swing"
        ? ("swing" as const)
        : ("standard" as const),
  };
  const band = normalizePartBandConfig(value.band, modules);

  return {
    id: normalizeId(value.id, `part-${index + 1}`),
    rootNote: normalizeRootNote(value.rootNote),
    noteCollectionKey: normalizeNoteCollectionKey(value.noteCollectionKey),
    band,
    automaticRhythm,
    ...(durationInBars !== undefined ? { durationInBars } : {}),
    ...(showHeader !== undefined ? { showHeader } : {}),
    modules,
  };
}
