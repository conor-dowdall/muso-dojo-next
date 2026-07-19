import { chordProgression } from "@musodojo/music-theory-data";
import {
  type AuthoredChordProgressionConfig,
  type MusicPartConfig,
  type PartModuleConfig,
} from "@/types/session";
import { normalizePartDurationInBars } from "@/utils/music-part/partDuration";
import { normalizePartBandConfig } from "@/utils/music-part/partBand";
import { normalizePartModuleConfig } from "@/utils/session/normalizePartModuleConfig";
import {
  ensureUniqueIds,
  isRecord,
  normalizeId,
  normalizeNoteCollectionKey,
  normalizeOptionalNoteName,
  normalizeOptionalNoteCollectionKey,
  normalizeOptionalBoolean,
  normalizeOptionalRootNote,
  normalizeRootNote,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";

function normalizeAuthoredChordProgressionConfig(
  value: unknown,
): AuthoredChordProgressionConfig | undefined {
  if (!isRecord(value) || value.kind !== "chord-progression") {
    return undefined;
  }

  const noteCollectionKey = normalizeOptionalNoteCollectionKey(
    value.noteCollectionKey,
  );
  const progressionInstanceId = normalizeString(value.progressionInstanceId);
  const sourceValue = isRecord(value.source) ? value.source : undefined;
  const customSourceName = normalizeString(sourceValue?.name);
  const source =
    sourceValue?.kind === "built-in" &&
    typeof sourceValue.progressionKey === "string" &&
    chordProgression.isValidKey(sourceValue.progressionKey)
      ? ({
          kind: "built-in" as const,
          progressionKey: sourceValue.progressionKey,
        } satisfies AuthoredChordProgressionConfig["source"])
      : sourceValue?.kind === "custom" && customSourceName
        ? ({
            kind: "custom" as const,
            name: customSourceName,
          } satisfies AuthoredChordProgressionConfig["source"])
        : typeof value.progressionKey === "string" &&
            chordProgression.isValidKey(value.progressionKey)
          ? ({
              kind: "built-in" as const,
              progressionKey: value.progressionKey,
            } satisfies AuthoredChordProgressionConfig["source"])
          : undefined;
  const romanSymbolValue = normalizeString(value.romanSymbol);
  const romanSymbol = chordProgression.isAnalysisRomanSymbol(romanSymbolValue)
    ? romanSymbolValue
    : undefined;
  const rootNote = normalizeOptionalNoteName(value.rootNote);
  const tonalCenter = normalizeOptionalRootNote(value.tonalCenter);

  if (
    !noteCollectionKey ||
    !progressionInstanceId ||
    !source ||
    !romanSymbol ||
    !rootNote ||
    !tonalCenter
  ) {
    return undefined;
  }

  return {
    kind: "chord-progression",
    noteCollectionKey,
    progressionInstanceId,
    source,
    romanSymbol,
    rootNote,
    tonalCenter,
  };
}

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
  const authoredProgression = normalizeAuthoredChordProgressionConfig(
    value.authoredProgression,
  );

  return {
    id: normalizeId(value.id, `part-${index + 1}`),
    rootNote: normalizeRootNote(value.rootNote),
    noteCollectionKey: normalizeNoteCollectionKey(value.noteCollectionKey),
    ...(authoredProgression ? { authoredProgression } : {}),
    band,
    automaticRhythm,
    ...(durationInBars !== undefined ? { durationInBars } : {}),
    ...(showHeader !== undefined ? { showHeader } : {}),
    modules,
  };
}
