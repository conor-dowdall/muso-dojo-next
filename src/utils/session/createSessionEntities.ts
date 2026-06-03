import { DEFAULT_KEYBOARD_THEME } from "@/data/keyboard/themes";
import { assertNever } from "@/utils/assertNever";
import {
  type DronePartModuleConfig,
  type InstrumentCreationConfig,
  type InstrumentInstanceConfig,
  type InstrumentPartModuleCreationConfig,
  type InstrumentType,
  type MusicPartCreationRequest,
  type MusicPartConfig,
  type PartModuleConfig,
  type PartModuleCreationRequest,
  type PartModuleType,
  type SessionConfig,
} from "@/types/session";
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
> extends Omit<MusicPartCreationRequest, "initialModule"> {
  id?: string;
  initialModule?: PartModuleCreationRequest<T>;
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
      } satisfies DronePartModuleConfig;
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
    default:
      return assertNever(request, "Unsupported part module type");
  }
}

export function createDefaultMusicPartConfig<
  T extends PartModuleType = PartModuleType,
>({
  id = createEntityId("part"),
  rootNote = DEFAULT_PART_ROOT_NOTE,
  noteCollectionKey = DEFAULT_PART_NOTE_COLLECTION_KEY,
  initialModule,
}: CreateMusicPartConfigOptions<T> = {}): MusicPartConfig {
  const part = normalizeMusicPartConfig({
    id,
    rootNote,
    noteCollectionKey,
    modules: initialModule
      ? [createDefaultPartModuleConfig(initialModule)]
      : [],
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
