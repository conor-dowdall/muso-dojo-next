import {
  type InstrumentPartModuleConfig,
  type PartModuleConfig,
} from "@/types/session";
import { assertNever } from "@/utils/assertNever";
import { normalizeInstrumentInstanceConfig } from "@/utils/session/normalizeInstrumentConfig";
import { isPartModuleType } from "@/utils/session/partModuleTypes";
import { isRecord, normalizeId } from "@/utils/session/normalizationPrimitives";

export function normalizePartModuleConfig(
  value: unknown,
  index = 0,
): PartModuleConfig | undefined {
  if (!isRecord(value) || !isPartModuleType(value.type)) {
    return undefined;
  }

  switch (value.type) {
    case "instrument": {
      const instrument = normalizeInstrumentInstanceConfig(value.instrument);

      if (!instrument) {
        return undefined;
      }

      return {
        id: normalizeId(value.id, `module-${index + 1}`),
        type: value.type,
        instrument,
      } satisfies InstrumentPartModuleConfig;
    }
    default:
      return assertNever(value.type, "Unsupported part module type");
  }
}
