import { DEFAULT_KEYBOARD_THEME } from "@/data/keyboard/themes";
import { assertNever } from "@/utils/assertNever";
import { getRhythmSelectionForPartDuration } from "@/utils/music-part/partDuration";
import {
  type DronePartModuleConfig,
  type ExerciseLooperPartModuleConfig,
  type InstrumentCreationConfig,
  type InstrumentInstanceConfig,
  type InstrumentPartModuleCreationConfig,
  type InstrumentType,
  type MusicPartCreationRequest,
  type MusicPartConfig,
  type PartModuleConfig,
  type PartModuleCreationRequest,
  type PartModuleType,
  type RhythmPartModuleConfig,
  type SessionConfig,
} from "@/types/session";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import { normalizeInstrumentInstanceConfig } from "@/utils/session/normalizeInstrumentConfig";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";
import { normalizeSessionConfig } from "@/utils/session/normalizeSessionConfig";
import {
  DEFAULT_INSTRUMENT_TYPE,
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
  DEFAULT_SESSION_NAME,
  FALLBACK_LAST_MODIFIED,
  FALLBACK_SESSION_ID,
} from "@/utils/session/sessionDefaults";

interface CreateMusicPartConfigOptions<
  T extends PartModuleType = PartModuleType,
> extends Omit<MusicPartCreationRequest, "moduleRequests"> {
  id?: string;
  moduleRequests?: PartModuleCreationRequest<T>[];
}

interface CreateSessionConfigOptions {
  id?: string;
  name?: string;
  lastModified?: string;
}

export function createEntityId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${suffix}`;
}

export function createDefaultInstrumentConfig(
  type: InstrumentType = DEFAULT_INSTRUMENT_TYPE,
  settings: InstrumentCreationConfig = {},
): InstrumentInstanceConfig {
  const instrument = normalizeInstrumentInstanceConfig({
    type,
    ...(type === "keyboard" ? { theme: DEFAULT_KEYBOARD_THEME } : {}),
    ...settings,
  });

  if (!instrument) {
    throw new Error(`Unable to create default ${type} instrument`);
  }

  return instrument;
}

function resolveInstrumentModuleCreationConfig(
  settings: InstrumentPartModuleCreationConfig | undefined,
): Required<InstrumentPartModuleCreationConfig> {
  return {
    instrumentType: settings?.instrumentType ?? DEFAULT_INSTRUMENT_TYPE,
    instrumentSettings: settings?.instrumentSettings ?? {},
  };
}

export function createDefaultPartModuleConfig<T extends PartModuleType>(
  request: PartModuleCreationRequest<T>,
): PartModuleConfig {
  switch (request.type) {
    case "drone": {
      return {
        id: createEntityId("module"),
        type: request.type,
        ...(request.settings?.octaveOffset !== undefined
          ? { octaveOffset: request.settings.octaveOffset }
          : {}),
        ...(request.settings?.wood ? { wood: request.settings.wood } : {}),
      } satisfies DronePartModuleConfig;
    }
    case "exercise-looper": {
      return {
        id: createEntityId("module"),
        type: request.type,
        ...(request.settings?.octaveOffset !== undefined
          ? { octaveOffset: request.settings.octaveOffset }
          : {}),
        ...(request.settings?.wood ? { wood: request.settings.wood } : {}),
      } satisfies ExerciseLooperPartModuleConfig;
    }
    case "instrument": {
      const { instrumentType, instrumentSettings } =
        resolveInstrumentModuleCreationConfig(request.settings);

      return {
        id: createEntityId("module"),
        type: request.type,
        instrument: createDefaultInstrumentConfig(
          instrumentType,
          instrumentSettings,
        ),
      };
    }
    case "rhythm": {
      return {
        id: createEntityId("module"),
        rhythm: request.settings?.rhythm ?? DEFAULT_RHYTHM_SELECTION,
        type: request.type,
        ...(request.settings?.wood ? { wood: request.settings.wood } : {}),
      } satisfies RhythmPartModuleConfig;
    }
    default:
      return assertNever(request, "Unsupported part module type");
  }
}

export function createDefaultPartModuleConfigs<T extends PartModuleType>(
  requests: readonly PartModuleCreationRequest<T>[],
): PartModuleConfig[] {
  return requests.map((request) => createDefaultPartModuleConfig(request));
}

function applyPartDurationToDefaultModule(
  module: PartModuleConfig,
  durationInBars: number | undefined,
): PartModuleConfig {
  if (module.type !== "rhythm") {
    return module;
  }

  return {
    ...module,
    rhythm: getRhythmSelectionForPartDuration(durationInBars, module.rhythm),
  };
}

export function createDefaultMusicPartConfig<
  T extends PartModuleType = PartModuleType,
>({
  id = createEntityId("part"),
  rootNote = DEFAULT_PART_ROOT_NOTE,
  noteCollectionKey = DEFAULT_PART_NOTE_COLLECTION_KEY,
  durationInBars,
  band,
  automaticRhythm,
  moduleRequests = [],
}: CreateMusicPartConfigOptions<T> = {}): MusicPartConfig {
  const modules = createDefaultPartModuleConfigs(moduleRequests).map((module) =>
    applyPartDurationToDefaultModule(module, durationInBars),
  );
  const resolvedAutomaticRhythm = {
    style: automaticRhythm?.style === "swing" ? "swing" : "standard",
  } as const;
  const part = normalizeMusicPartConfig({
    id,
    rootNote,
    noteCollectionKey,
    durationInBars,
    band,
    automaticRhythm: resolvedAutomaticRhythm,
    modules,
  });

  if (!part) {
    throw new Error("Unable to create default music part");
  }

  return part;
}

export function createDefaultSessionConfig({
  id = createEntityId("session"),
  name = DEFAULT_SESSION_NAME,
  lastModified = new Date().toISOString(),
}: CreateSessionConfigOptions = {}): SessionConfig {
  return normalizeSessionConfig({
    id,
    name,
    lastModified,
    parts: [],
  });
}

export function createFallbackSessionConfig(): SessionConfig {
  return createDefaultSessionConfig({
    id: FALLBACK_SESSION_ID,
    name: DEFAULT_SESSION_NAME,
    lastModified: FALLBACK_LAST_MODIFIED,
  });
}
