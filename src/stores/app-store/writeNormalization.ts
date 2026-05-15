import { normalizeInstrumentInstanceConfig } from "@/utils/session/normalizeInstrumentConfig";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";
import { normalizePartModuleConfig } from "@/utils/session/normalizePartModuleConfig";
import { normalizeSessionConfig } from "@/utils/session/normalizeSessionConfig";
import {
  type InstrumentInstanceConfig,
  type MusicPartConfig,
  type PartModuleConfig,
  type SessionConfig,
} from "@/types/session";
import { assertNever } from "@/utils/assertNever";

export function normalizeSessionForWrite(session: SessionConfig) {
  return normalizeSessionConfig({
    ...session,
    lastModified: new Date().toISOString(),
  });
}

export function normalizeInstrumentForWrite(
  instrument: unknown,
): InstrumentInstanceConfig {
  const normalized = normalizeInstrumentInstanceConfig(instrument);

  if (!normalized) {
    throw new Error("Unable to normalize instrument");
  }

  return normalized;
}

export function normalizePartModuleForWrite(module: unknown): PartModuleConfig {
  const normalized = normalizePartModuleConfig(module);

  if (!normalized) {
    throw new Error("Unable to normalize part module");
  }

  return normalized;
}

export function normalizeMusicPartForWrite(
  part: MusicPartConfig,
): MusicPartConfig {
  const normalized = normalizeMusicPartConfig(part);

  if (!normalized) {
    throw new Error(`Unable to normalize music part "${part.id}"`);
  }

  return normalized;
}

export function clearInstrumentActiveNotes<T extends { activeNotes?: unknown }>(
  instrument: T,
): T {
  const nextInstrument = { ...instrument };
  delete nextInstrument.activeNotes;
  return nextInstrument;
}

function clearModuleActiveNotesAffectedByPartTheory(
  module: PartModuleConfig,
): PartModuleConfig {
  switch (module.type) {
    case "instrument":
      return {
        ...module,
        instrument: clearInstrumentActiveNotes(module.instrument),
      };
    default:
      return assertNever(module.type, "Unsupported part module type");
  }
}

export function clearActiveNotesAffectedByPartTheory(
  part: MusicPartConfig,
): MusicPartConfig {
  return {
    ...part,
    modules: part.modules.map(clearModuleActiveNotesAffectedByPartTheory),
  };
}
