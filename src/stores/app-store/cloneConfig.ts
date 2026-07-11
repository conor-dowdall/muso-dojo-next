import {
  createCopyId,
  createSessionCopyName,
  createUniqueSessionName,
} from "./entityIds";
import {
  normalizeMusicPartForWrite,
  normalizePartModuleForWrite,
  normalizeSessionForWrite,
} from "./writeNormalization";
import {
  type MusicPartConfig,
  type PartBandSourceConfig,
  type PartModuleConfig,
  type SessionConfig,
} from "@/types/session";

function cloneSerializableConfig<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function clonePartModuleConfig(
  module: PartModuleConfig,
  existingIds: Iterable<string>,
): PartModuleConfig {
  return normalizePartModuleForWrite({
    ...cloneSerializableConfig(module),
    id: createCopyId(module.id, existingIds),
  });
}

export function cloneMusicPartConfig(
  part: MusicPartConfig,
  existingPartIds: Iterable<string>,
): MusicPartConfig {
  const existingModuleIds = part.modules.map((module) => module.id);
  const clonedModules = part.modules.map((module) => {
    const clone = clonePartModuleConfig(module, existingModuleIds);
    existingModuleIds.push(clone.id);
    return clone;
  });
  const moduleIdMap = new Map(
    part.modules.map((module, index) => [module.id, clonedModules[index]?.id]),
  );
  const cloneBandSource = (source: PartBandSourceConfig) =>
    source.mode === "module" && moduleIdMap.get(source.moduleId)
      ? {
          mode: "module" as const,
          moduleId: moduleIdMap.get(source.moduleId) as string,
        }
      : source;
  const clonedBand = part.band
    ? {
        backingNotes: cloneBandSource(part.band.backingNotes),
        rhythm: cloneBandSource(part.band.rhythm),
      }
    : undefined;

  return normalizeMusicPartForWrite({
    ...cloneSerializableConfig(part),
    id: createCopyId(part.id, existingPartIds),
    modules: clonedModules,
    ...(clonedBand ? { band: clonedBand } : {}),
  });
}

export function cloneSessionConfig(
  session: SessionConfig,
  existingSessionIds: Iterable<string>,
  existingSessionNames: Iterable<string>,
): SessionConfig {
  const existingPartIds = session.parts.map((part) => part.id);
  const clonedParts = session.parts.map((part) => {
    const clone = cloneMusicPartConfig(part, existingPartIds);
    existingPartIds.push(clone.id);
    return clone;
  });

  return normalizeSessionForWrite({
    ...cloneSerializableConfig(session),
    id: createCopyId(session.id, existingSessionIds),
    name: createUniqueSessionName(
      createSessionCopyName(session.name),
      existingSessionNames,
    ),
    parts: clonedParts,
  });
}
