import {
  type InstrumentPartModuleConfig,
  type InstrumentType,
  type PartModuleConfig,
  type PartModuleType,
} from "@/types/session";

const partModuleTypes = {
  instrument: true,
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
