import {
  type DronePartModuleConfig,
  type ExerciseLooperPartModuleConfig,
  type InstrumentPartModuleConfig,
  type InstrumentType,
  type PartModuleConfig,
  type PartModuleType,
  type RhythmPartModuleConfig,
} from "@/types/session";

const partModuleTypes = {
  drone: true,
  "exercise-looper": true,
  instrument: true,
  rhythm: true,
} satisfies Record<PartModuleType, true>;

const instrumentTypes = {
  fretboard: true,
  keyboard: true,
} satisfies Record<InstrumentType, true>;

export function isPartModuleType(value: unknown): value is PartModuleType {
  return typeof value === "string" && value in partModuleTypes;
}

export function isInstrumentType(value: unknown): value is InstrumentType {
  return typeof value === "string" && value in instrumentTypes;
}

export function isInstrumentPartModule(
  module: PartModuleConfig | undefined,
): module is InstrumentPartModuleConfig {
  return module?.type === "instrument";
}

export function isDronePartModule(
  module: PartModuleConfig | undefined,
): module is DronePartModuleConfig {
  return module?.type === "drone";
}

export function isExerciseLooperPartModule(
  module: PartModuleConfig | undefined,
): module is ExerciseLooperPartModuleConfig {
  return module?.type === "exercise-looper";
}

export function isRhythmPartModule(
  module: PartModuleConfig | undefined,
): module is RhythmPartModuleConfig {
  return module?.type === "rhythm";
}
