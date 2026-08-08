import {
  type MusicPartConfig,
  type PartBandSourceConfig,
} from "@/types/session";
import { reserveUniqueId } from "@/utils/session/normalizationPrimitives";

/**
 * Enforces Module identity across a complete playable Part graph. Band sources
 * are Part-local, so they can be remapped without ambiguity when a collision is
 * repaired in a later Part.
 */
export function ensureUniqueMusicPartModuleIds(parts: MusicPartConfig[]) {
  const usedModuleIds = new Set<string>();
  let changed = false;

  const normalizedParts = parts.map((part) => {
    const moduleIds = new Map<string, string>();
    let partChanged = false;
    const modules = part.modules.map((module) => {
      const id = reserveUniqueId(module.id, usedModuleIds);
      moduleIds.set(module.id, id);

      if (id === module.id) {
        return module;
      }

      changed = true;
      partChanged = true;
      return { ...module, id };
    });

    if (!partChanged) {
      return part;
    }

    const remapBandSource = (
      source: PartBandSourceConfig,
    ): PartBandSourceConfig =>
      source.mode === "module" && moduleIds.has(source.moduleId)
        ? { mode: "module", moduleId: moduleIds.get(source.moduleId)! }
        : source;

    return {
      ...part,
      modules,
      ...(part.band
        ? {
            band: {
              backingNotes: remapBandSource(part.band.backingNotes),
              rhythm: remapBandSource(part.band.rhythm),
            },
          }
        : {}),
    };
  });

  return changed ? normalizedParts : parts;
}
