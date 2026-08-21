import { describe, expect, it } from "vitest";
import { type DojoSettings } from "@/types/session";
import {
  createDojoResourceImportCatalog,
  mergeDojoBackupResources,
} from "@/utils/dojo-backup/dojoResourceImport";

const changes = {
  chords: [
    {
      chordCollectionKey: "major",
      degree: "1",
      durationInBars: 1,
    },
  ],
} as const;

function createCurrentSettings(): DojoSettings {
  return {
    appTheme: "ocean",
    customChordProgressions: [
      { id: "current-progression", name: "My Changes", progression: changes },
    ],
    customFretboardTunings: [
      {
        id: "current-tuning",
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
      {
        id: "current-copy",
        instrument: "guitar",
        name: "Open D Copy",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
    ],
    noteColorConfig: { preset: "musoDojo", source: "preset" },
  };
}

function createBackupSettings(): DojoSettings {
  return {
    appTheme: "purple",
    customChordProgressions: [
      {
        editingGridPositionCount: 5,
        id: "backup-collision",
        name: "my changes",
        progression: changes,
      },
      {
        editingGridPositionCount: 6,
        id: "backup-new",
        name: "Turnaround",
        progression: changes,
      },
    ],
    customFretboardTunings: [
      {
        id: "backup-tuning-collision",
        instrument: "guitar",
        name: "open d",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
      {
        id: "backup-other-instrument",
        instrument: "bassGuitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 55],
      },
    ],
  };
}

describe("Dojo backup resource import", () => {
  it("catalogs resources and scopes tuning name collisions by instrument", () => {
    const catalog = createDojoResourceImportCatalog(
      createCurrentSettings(),
      createBackupSettings(),
    );

    expect(catalog.tunings).toMatchObject([
      {
        collision: true,
        keepBothName: "open d Copy 2",
        key: "tuning:backup-tuning-collision",
      },
      {
        collision: false,
        key: "tuning:backup-other-instrument",
      },
    ]);
    expect(catalog.progressions).toMatchObject([
      {
        collision: true,
        keepBothName: "my changes Copy",
        key: "progression:backup-collision",
      },
      { collision: false, key: "progression:backup-new" },
    ]);
  });

  it("merges selected resources with new IDs and preserves active settings", () => {
    const current = createCurrentSettings();
    const backup = createBackupSettings();
    let idIndex = 0;
    const result = mergeDojoBackupResources(
      current,
      backup,
      new Set(["tuning:backup-tuning-collision", "progression:backup-new"]),
      (kind) => `imported-${kind}-${++idIndex}`,
    );

    expect(result).toMatchObject({ imported: 2, skipped: 2 });
    expect(result.dojoSettings).toMatchObject({
      appTheme: "ocean",
      noteColorConfig: { preset: "musoDojo", source: "preset" },
    });
    expect(result.dojoSettings.customFretboardTunings).toHaveLength(3);
    expect(result.dojoSettings.customFretboardTunings?.at(-1)).toMatchObject({
      id: "imported-tuning-1",
      name: "open d Copy 2",
    });
    expect(result.dojoSettings.customChordProgressions).toHaveLength(2);
    expect(result.dojoSettings.customChordProgressions?.at(-1)).toMatchObject({
      editingGridPositionCount: 6,
      id: "imported-progression-2",
      name: "Turnaround",
    });
    expect(result.dojoSettings.customChordProgressions?.at(-1)).not.toBe(
      backup.customChordProgressions?.[1],
    );
    expect(result.dojoSettings.customFretboardTunings?.at(-1)).not.toBe(
      backup.customFretboardTunings?.[0],
    );
  });

  it("keeps the current settings object unchanged when every resource is skipped", () => {
    const current = createCurrentSettings();
    const result = mergeDojoBackupResources(
      current,
      createBackupSettings(),
      new Set(),
      () => "unused",
    );

    expect(result).toEqual({ dojoSettings: current, imported: 0, skipped: 4 });
    expect(result.dojoSettings).toBe(current);
  });
});
