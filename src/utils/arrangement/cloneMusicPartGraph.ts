import { createEntityId } from "@/utils/session/createSessionEntities";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";
import {
  type MusicPartConfig,
  type PartBandSourceConfig,
} from "@/types/session";

export interface CloneMusicPartGraphOptions {
  createModuleId?: () => string;
  createPartId?: () => string;
  createProgressionInstanceId?: () => string;
}

function cloneSerializable<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

export function cloneMusicPartGraph(
  parts: readonly MusicPartConfig[],
  {
    createModuleId = () => createEntityId("module"),
    createPartId = () => createEntityId("part"),
    createProgressionInstanceId = () => createEntityId("progression"),
  }: CloneMusicPartGraphOptions = {},
): MusicPartConfig[] {
  const progressionIds = new Map<string, string>();

  return parts.map((sourcePart, partIndex) => {
    const moduleIds = new Map(
      sourcePart.modules.map((module) => [module.id, createModuleId()]),
    );
    const remapBandSource = (
      source: PartBandSourceConfig,
    ): PartBandSourceConfig =>
      source.mode === "module" && moduleIds.has(source.moduleId)
        ? { mode: "module", moduleId: moduleIds.get(source.moduleId)! }
        : source;
    const authoredProgression = sourcePart.authoredProgression
      ? {
          ...cloneSerializable(sourcePart.authoredProgression),
          progressionInstanceId:
            progressionIds.get(
              sourcePart.authoredProgression.progressionInstanceId,
            ) ??
            (() => {
              const id = createProgressionInstanceId();
              progressionIds.set(
                sourcePart.authoredProgression!.progressionInstanceId,
                id,
              );
              return id;
            })(),
        }
      : undefined;
    const normalized = normalizeMusicPartConfig(
      {
        ...cloneSerializable(sourcePart),
        id: createPartId(),
        modules: sourcePart.modules.map((module) => ({
          ...cloneSerializable(module),
          id: moduleIds.get(module.id)!,
        })),
        ...(sourcePart.band
          ? {
              band: {
                backingNotes: remapBandSource(sourcePart.band.backingNotes),
                rhythm: remapBandSource(sourcePart.band.rhythm),
              },
            }
          : {}),
        ...(authoredProgression ? { authoredProgression } : {}),
      },
      partIndex,
    );

    if (!normalized) {
      throw new Error("Unable to clone music Part graph");
    }

    return normalized;
  });
}
