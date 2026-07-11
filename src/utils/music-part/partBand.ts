import {
  type MusicPartConfig,
  type PartBandConfig,
  type PartBandRole,
  type PartBandSourceConfig,
  type PartModuleConfig,
} from "@/types/session";

export const AUTOMATIC_PART_BAND_SOURCE = {
  mode: "automatic",
} as const satisfies PartBandSourceConfig;

export const OFF_PART_BAND_SOURCE = {
  mode: "off",
} as const satisfies PartBandSourceConfig;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function moduleMatchesRole(module: PartModuleConfig, role: PartBandRole) {
  return role === "backingNotes"
    ? module.type === "exercise-looper"
    : module.type === "rhythm";
}

export function getPartBandModules(
  modules: readonly PartModuleConfig[],
  role: PartBandRole,
) {
  return modules.filter((module) => moduleMatchesRole(module, role));
}

function getDefaultPartBandSource(
  modules: readonly PartModuleConfig[],
  role: PartBandRole,
): PartBandSourceConfig {
  const firstModule = getPartBandModules(modules, role)[0];

  return firstModule
    ? { mode: "module", moduleId: firstModule.id }
    : AUTOMATIC_PART_BAND_SOURCE;
}

function normalizePartBandSource(
  value: unknown,
  modules: readonly PartModuleConfig[],
  role: PartBandRole,
): PartBandSourceConfig {
  if (!isRecord(value)) {
    return AUTOMATIC_PART_BAND_SOURCE;
  }

  if (value.mode === "off") {
    return OFF_PART_BAND_SOURCE;
  }

  if (
    value.mode === "module" &&
    typeof value.moduleId === "string" &&
    getPartBandModules(modules, role).some(
      (module) => module.id === value.moduleId,
    )
  ) {
    return { mode: "module", moduleId: value.moduleId };
  }

  return AUTOMATIC_PART_BAND_SOURCE;
}

export function normalizePartBandConfig(
  value: unknown,
  modules: readonly PartModuleConfig[],
): PartBandConfig {
  if (!isRecord(value)) {
    return {
      backingNotes: getDefaultPartBandSource(modules, "backingNotes"),
      rhythm: getDefaultPartBandSource(modules, "rhythm"),
    };
  }

  return {
    backingNotes: normalizePartBandSource(
      value.backingNotes,
      modules,
      "backingNotes",
    ),
    rhythm: normalizePartBandSource(value.rhythm, modules, "rhythm"),
  };
}

export function getPartBandConfig(
  part: Pick<MusicPartConfig, "band" | "modules">,
) {
  return normalizePartBandConfig(part.band, part.modules);
}

export function getPartBandSource(
  part: Pick<MusicPartConfig, "band" | "modules">,
  role: PartBandRole,
) {
  return getPartBandConfig(part)[role];
}

export function getPartBandModule(
  part: Pick<MusicPartConfig, "band" | "modules">,
  role: PartBandRole,
) {
  const source = getPartBandSource(part, role);

  return source.mode === "module"
    ? getPartBandModules(part.modules, role).find(
        (module) => module.id === source.moduleId,
      )
    : undefined;
}

export function isPartBandModule(
  part: Pick<MusicPartConfig, "band" | "modules">,
  role: PartBandRole,
  moduleId: string,
) {
  const source = getPartBandSource(part, role);
  return source.mode === "module" && source.moduleId === moduleId;
}

export function setPartBandSource(
  part: MusicPartConfig,
  role: PartBandRole,
  source: PartBandSourceConfig,
): MusicPartConfig {
  const band = getPartBandConfig(part);
  const normalizedSource = normalizePartBandSource(source, part.modules, role);

  return {
    ...part,
    band: { ...band, [role]: normalizedSource },
  };
}

export function reconcilePartBandAfterModuleRemoval(
  part: MusicPartConfig,
  moduleId: string,
) {
  const band = getPartBandConfig(part);
  const backingNotes =
    band.backingNotes.mode === "module" &&
    band.backingNotes.moduleId === moduleId
      ? AUTOMATIC_PART_BAND_SOURCE
      : band.backingNotes;
  const rhythm =
    band.rhythm.mode === "module" && band.rhythm.moduleId === moduleId
      ? AUTOMATIC_PART_BAND_SOURCE
      : band.rhythm;

  return {
    ...part,
    band: { backingNotes, rhythm },
  };
}
