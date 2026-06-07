import { type MusicPartConfig, type SessionConfig } from "@/types/session";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";
import {
  ensureUniqueIds,
  isRecord,
  normalizeId,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";
import {
  DEFAULT_SESSION_NAME,
  FALLBACK_LAST_MODIFIED,
  FALLBACK_SESSION_ID,
} from "@/utils/session/sessionDefaults";

export function normalizeSessionConfig(value: unknown): SessionConfig {
  const input = isRecord(value) ? value : {};
  const parts = Array.isArray(input.parts)
    ? input.parts
        .map((part, partIndex) => normalizeMusicPartConfig(part, partIndex))
        .filter((part): part is MusicPartConfig => Boolean(part))
    : [];

  return {
    ...(typeof input.countInBeats === "number" &&
    Number.isInteger(input.countInBeats) &&
    input.countInBeats >= 0 &&
    input.countInBeats <= 8 &&
    input.countInBeats !== 4
      ? { countInBeats: input.countInBeats }
      : {}),
    id: normalizeId(input.id, FALLBACK_SESSION_ID),
    name: normalizeString(input.name) ?? DEFAULT_SESSION_NAME,
    lastModified: normalizeString(input.lastModified) ?? FALLBACK_LAST_MODIFIED,
    ...(input.metronomeEnabled === false ? { metronomeEnabled: false } : {}),
    parts: ensureUniqueIds(parts),
    ...(typeof input.tempoBpm === "number" &&
    Number.isInteger(input.tempoBpm) &&
    input.tempoBpm >= 30 &&
    input.tempoBpm <= 300 &&
    input.tempoBpm !== 80
      ? { tempoBpm: input.tempoBpm }
      : {}),
  };
}
