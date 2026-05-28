import { type MusicPartConfig, type PartModuleConfig } from "@/types/session";
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

  return {
    id: normalizeId(value.id, `part-${index + 1}`),
    rootNote: normalizeRootNote(value.rootNote),
    noteCollectionKey: normalizeNoteCollectionKey(value.noteCollectionKey),
    ...(showHeader !== undefined ? { showHeader } : {}),
    modules: ensureUniqueIds(modules),
  };
}
