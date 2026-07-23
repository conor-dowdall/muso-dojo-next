import {
  type ArrangementConfig,
  type ArrangementEntryConfig,
  type ArrangementPlaybackMode,
  type ArrangementSectionConfig,
} from "@/types/arrangement";
import { type MusicPartConfig } from "@/types/session";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";
import {
  ensureUniqueIds,
  isRecord,
  normalizeId,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";
import { normalizeSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import { FALLBACK_LAST_MODIFIED } from "@/utils/session/sessionDefaults";
import { DEFAULT_ARRANGEMENT_NAME } from "@/stores/app-store/entityIds";

function clampInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}

function normalizePlaybackMode(value: unknown): ArrangementPlaybackMode {
  return value === "loop" ? "loop" : "once";
}

function normalizeSection(
  value: unknown,
  index: number,
): ArrangementSectionConfig {
  const input = isRecord(value) ? value : {};
  const source = isRecord(input.source) ? input.source : {};
  const parts = Array.isArray(input.parts)
    ? input.parts
        .map((part, partIndex) => normalizeMusicPartConfig(part, partIndex))
        .filter((part): part is MusicPartConfig => Boolean(part))
    : [];

  return {
    id: normalizeId(input.id, `section-${index + 1}`),
    name: normalizeString(input.name) ?? `Section ${index + 1}`,
    source: {
      sessionId: normalizeString(source.sessionId) ?? "unavailable-session",
      sessionName: normalizeString(source.sessionName) ?? "Unavailable Session",
      sessionLastModified:
        normalizeString(source.sessionLastModified) ?? FALLBACK_LAST_MODIFIED,
      sessionTempoBpm: clampInteger(source.sessionTempoBpm, 80, 30, 300),
      capturedAt: normalizeString(source.capturedAt) ?? FALLBACK_LAST_MODIFIED,
    },
    backingBand: normalizeSessionBackingBandConfig(input.backingBand),
    parts: ensureUniqueIds(parts),
  };
}

function normalizeEntry(value: unknown, index: number): ArrangementEntryConfig {
  const input = isRecord(value) ? value : {};
  return {
    id: normalizeId(input.id, `entry-${index + 1}`),
    sectionId: normalizeString(input.sectionId) ?? "",
    playCount: clampInteger(input.playCount, 1, 1, 99),
  };
}

export function normalizeArrangementConfig(
  value: unknown,
  fallbackId = "arrangement",
): ArrangementConfig {
  const input = isRecord(value) ? value : {};
  const sections = ensureUniqueIds(
    (Array.isArray(input.sections) ? input.sections : []).map(normalizeSection),
  );
  const sectionIds = new Set(sections.map((section) => section.id));
  const entries = ensureUniqueIds(
    (Array.isArray(input.entries) ? input.entries : []).map(normalizeEntry),
  ).filter((entry) => sectionIds.has(entry.sectionId));
  const referencedSectionIds = new Set(entries.map((entry) => entry.sectionId));

  return {
    id: normalizeId(input.id, fallbackId),
    name: normalizeString(input.name) ?? DEFAULT_ARRANGEMENT_NAME,
    lastModified: normalizeString(input.lastModified) ?? FALLBACK_LAST_MODIFIED,
    tempoBpm: clampInteger(input.tempoBpm, 80, 30, 300),
    playbackMode: normalizePlaybackMode(input.playbackMode),
    sections: sections.filter((section) =>
      referencedSectionIds.has(section.id),
    ),
    entries,
  };
}
