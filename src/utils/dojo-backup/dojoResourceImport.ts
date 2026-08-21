import { stringInstruments } from "@musodojo/music-theory-data";
import {
  createEntityCopyName,
  createUniqueEntityName,
} from "@/stores/app-store/entityIds";
import { type SavedChordProgression } from "@/types/custom-chord-progression";
import { type SavedFretboardTuning } from "@/types/custom-fretboard-tuning";
import { type DojoSettings } from "@/types/session";
import { formatCustomOpenStringNotes } from "@/utils/fretboard/customFretboardTunings";
import {
  CHORD_PROGRESSION_BAR_SEPARATOR,
  getChordProgressionRomanBarLabels,
} from "@/utils/music-theory/chordProgressions";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

export type DojoResourceImportKind = "progression" | "tuning";

interface DojoResourceImportCandidateBase {
  collision: boolean;
  keepBothName?: string;
  key: string;
  kind: DojoResourceImportKind;
  name: string;
  subtitle: string;
}

export interface DojoTuningImportCandidate extends DojoResourceImportCandidateBase {
  kind: "tuning";
  resource: SavedFretboardTuning;
}

export interface DojoProgressionImportCandidate extends DojoResourceImportCandidateBase {
  kind: "progression";
  resource: SavedChordProgression;
}

export type DojoResourceImportCandidate =
  DojoTuningImportCandidate | DojoProgressionImportCandidate;

export interface DojoResourceImportCatalog {
  progressions: DojoProgressionImportCandidate[];
  tunings: DojoTuningImportCandidate[];
}

export interface DojoResourceImportResult {
  dojoSettings: DojoSettings;
  imported: number;
  skipped: number;
}

function tuningKey(id: string) {
  return `tuning:${id}`;
}

function progressionKey(id: string) {
  return `progression:${id}`;
}

function normalizedName(name: string) {
  return name.trim().toLocaleLowerCase();
}

function createTuningCatalog(
  currentTunings: readonly SavedFretboardTuning[],
  backupTunings: readonly SavedFretboardTuning[],
) {
  const existingNamesByInstrument = new Map<string, Set<string>>();
  const reservedNamesByInstrument = new Map<string, string[]>();

  for (const tuning of currentTunings) {
    const existing =
      existingNamesByInstrument.get(tuning.instrument) ?? new Set<string>();
    existing.add(normalizedName(tuning.name));
    existingNamesByInstrument.set(tuning.instrument, existing);
  }

  for (const tuning of [...currentTunings, ...backupTunings]) {
    const reserved = reservedNamesByInstrument.get(tuning.instrument) ?? [];
    reserved.push(tuning.name);
    reservedNamesByInstrument.set(tuning.instrument, reserved);
  }

  return backupTunings.map((resource): DojoTuningImportCandidate => {
    const collision =
      existingNamesByInstrument
        .get(resource.instrument)
        ?.has(normalizedName(resource.name)) ?? false;
    const reservedNames =
      reservedNamesByInstrument.get(resource.instrument) ?? [];
    const keepBothName = collision
      ? createUniqueEntityName(
          createEntityCopyName(resource.name),
          reservedNames,
          resource.name,
        )
      : undefined;

    if (keepBothName) {
      reservedNames.push(keepBothName);
    }

    return {
      collision,
      ...(keepBothName ? { keepBothName } : {}),
      key: tuningKey(resource.id),
      kind: "tuning",
      name: resource.name,
      resource,
      subtitle: `${stringInstruments[resource.instrument].primaryName}${DISPLAY_VALUE_SEPARATOR}${formatCustomOpenStringNotes(resource.openMidiNotes)}`,
    };
  });
}

function createProgressionCatalog(
  currentProgressions: readonly SavedChordProgression[],
  backupProgressions: readonly SavedChordProgression[],
) {
  const existingNames = new Set(
    currentProgressions.map(({ name }) => normalizedName(name)),
  );
  const reservedNames = [...currentProgressions, ...backupProgressions].map(
    ({ name }) => name,
  );

  return backupProgressions.map((resource): DojoProgressionImportCandidate => {
    const collision = existingNames.has(normalizedName(resource.name));
    const keepBothName = collision
      ? createUniqueEntityName(
          createEntityCopyName(resource.name),
          reservedNames,
          resource.name,
        )
      : undefined;

    if (keepBothName) {
      reservedNames.push(keepBothName);
    }

    return {
      collision,
      ...(keepBothName ? { keepBothName } : {}),
      key: progressionKey(resource.id),
      kind: "progression",
      name: resource.name,
      resource,
      subtitle: getChordProgressionRomanBarLabels(resource.progression).join(
        CHORD_PROGRESSION_BAR_SEPARATOR,
      ),
    };
  });
}

export function createDojoResourceImportCatalog(
  currentSettings: DojoSettings,
  backupSettings: DojoSettings,
): DojoResourceImportCatalog {
  return {
    progressions: createProgressionCatalog(
      currentSettings.customChordProgressions ?? [],
      backupSettings.customChordProgressions ?? [],
    ),
    tunings: createTuningCatalog(
      currentSettings.customFretboardTunings ?? [],
      backupSettings.customFretboardTunings ?? [],
    ),
  };
}

export function mergeDojoBackupResources(
  currentSettings: DojoSettings,
  backupSettings: DojoSettings,
  selectedKeys: ReadonlySet<string>,
  createId: (kind: DojoResourceImportKind) => string,
): DojoResourceImportResult {
  const catalog = createDojoResourceImportCatalog(
    currentSettings,
    backupSettings,
  );
  const selectedTunings = catalog.tunings.filter(({ key }) =>
    selectedKeys.has(key),
  );
  const selectedProgressions = catalog.progressions.filter(({ key }) =>
    selectedKeys.has(key),
  );
  const importedTunings = selectedTunings.map((candidate) => ({
    id: createId("tuning"),
    instrument: candidate.resource.instrument,
    name: candidate.keepBothName ?? candidate.resource.name,
    openMidiNotes: [
      ...candidate.resource.openMidiNotes,
    ] as SavedFretboardTuning["openMidiNotes"],
  }));
  const importedProgressions = selectedProgressions.map((candidate) => ({
    editingGridPositionCount: candidate.resource.editingGridPositionCount,
    id: createId("progression"),
    name: candidate.keepBothName ?? candidate.resource.name,
    progression: {
      ...candidate.resource.progression,
      chords: candidate.resource.progression.chords.map((chord) => ({
        ...chord,
      })) as unknown as SavedChordProgression["progression"]["chords"],
    },
  }));
  const imported = importedTunings.length + importedProgressions.length;
  const total = catalog.tunings.length + catalog.progressions.length;

  if (imported === 0) {
    return { dojoSettings: currentSettings, imported, skipped: total };
  }

  return {
    dojoSettings: {
      ...currentSettings,
      ...(importedTunings.length > 0
        ? {
            customFretboardTunings: [
              ...(currentSettings.customFretboardTunings ?? []),
              ...importedTunings,
            ],
          }
        : {}),
      ...(importedProgressions.length > 0
        ? {
            customChordProgressions: [
              ...(currentSettings.customChordProgressions ?? []),
              ...importedProgressions,
            ],
          }
        : {}),
    },
    imported,
    skipped: total - imported,
  };
}
