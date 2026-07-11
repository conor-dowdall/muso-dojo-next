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
import { normalizeSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";

export function normalizeSessionConfig(value: unknown): SessionConfig {
  const input = isRecord(value) ? value : {};
  const parts = Array.isArray(input.parts)
    ? input.parts
        .map((part, partIndex) => normalizeMusicPartConfig(part, partIndex))
        .filter((part): part is MusicPartConfig => Boolean(part))
    : [];

  return {
    backingBand: normalizeSessionBackingBandConfig(input.backingBand),
    id: normalizeId(input.id, FALLBACK_SESSION_ID),
    name: normalizeString(input.name) ?? DEFAULT_SESSION_NAME,
    lastModified: normalizeString(input.lastModified) ?? FALLBACK_LAST_MODIFIED,
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
