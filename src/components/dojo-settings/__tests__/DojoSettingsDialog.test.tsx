import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";
import {
  DojoRestoreAction,
  DojoStartFreshAction,
} from "@/components/dojo-settings/DojoBackupSettings";
import { APP_STORE_VERSION } from "@/stores/app-store/persistence";
import { createStoreSnapshot } from "@/stores/app-store/__tests__/appStoreTestUtils";

function createRestoreBackup() {
  const snapshot = createStoreSnapshot();
  const firstSession = snapshot.sessions["session-1"];

  if (!firstSession) {
    throw new Error("Expected the restore fixture Session to exist");
  }

  snapshot.sessions["session-2"] = {
    ...firstSession,
    id: "session-2",
    name: "Second Session",
  };
  snapshot.arrangements["arrangement-1"] = {
    entries: [],
    id: "arrangement-1",
    lastModified: "2026-07-26T14:30:22.000Z",
    name: "Arrangement",
    playbackMode: "once",
    sections: [],
    tempoBpm: 80,
    workspaceViewMode: "build",
  };
  snapshot.dojoSettings.customFretboardTunings = Array.from(
    { length: 3 },
    (_, index) => ({
      id: `tuning-${index + 1}`,
      instrument: "guitar" as const,
      name: `Tuning ${index + 1}`,
      openMidiNotes: [40, 45, 50, 55, 59, 64],
    }),
  );
  snapshot.dojoSettings.customChordProgressions = Array.from(
    { length: 4 },
    (_, index) => ({
      id: `progression-${index + 1}`,
      name: `Progression ${index + 1}`,
      progression: {
        chords: [
          {
            chordCollectionKey: "major" as const,
            degree: "1" as const,
            durationInBars: 1,
          },
        ],
      },
    }),
  );

  return {
    dataVersion: APP_STORE_VERSION,
    exportedAt: "2026-07-26T14:30:22.000Z",
    formatVersion: 1 as const,
    snapshot,
  };
}

describe("DojoSettingsDialog", () => {
  it("places backup controls in a separated section after appearance settings", () => {
    const markup = renderToStaticMarkup(
      <DojoSettingsDialog onClose={() => undefined} />,
    );
    const appearanceIndex = markup.indexOf('aria-label="Appearance settings"');
    const backupsIndex = markup.indexOf('aria-label="Data &amp; Backups"');

    expect(markup).toContain('data-layout="stack"');
    expect(appearanceIndex).toBeGreaterThanOrEqual(0);
    expect(backupsIndex).toBeGreaterThan(appearanceIndex);
    expect(markup).toContain("Data &amp; Backups");
    expect(markup).toContain(
      "Everything in your Dojo is saved automatically on this device.",
    );
    expect(markup).toContain("Back Up Dojo");
    expect(markup).toContain("Save all Dojo data as a backup file.");
    expect(markup).toContain("Restore Dojo");
    expect(markup).toContain("Restore all Dojo data from a backup file.");
    expect(markup).toContain("Clear Sessions &amp; Arrangements");
    expect(markup).toContain(
      "Remove all Sessions and Arrangements. Your personal library and preferences will remain.",
    );
    expect(markup).not.toContain("Save the Set");
    expect(markup).not.toContain("Recall a Set");
    expect(markup).not.toContain("current Dojo");
    expect(markup).toContain('accept=".json,application/json"');
  });

  it("shows the complete clear action impact in its confirmation", () => {
    const markup = renderToStaticMarkup(
      <DojoStartFreshAction
        counts={{
          arrangements: 1,
          sessions: 2,
        }}
        isConfirming
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onDownloadBackup={() => undefined}
        onRequestConfirm={() => undefined}
      />,
    );

    expect(markup).toContain("Clear Sessions &amp; Arrangements?");
    expect(markup).toContain("2 Sessions • 1 Arrangement");
    expect(markup).toContain("Replaced by one new empty Session.");
    expect(markup).not.toContain("Custom Tunings •");
    expect(markup).toContain(
      "Your Custom Tunings, Custom Chord Progressions, and preferences will remain.",
    );
    expect(markup).toContain("Cancel");
    expect(markup).toContain("Download Backup");
    expect(markup).toContain("Clear Sessions &amp; Arrangements");
    expect(markup).toContain('data-tone="danger"');
  });

  it("keeps the clear action neutral until confirmation", () => {
    const markup = renderToStaticMarkup(
      <DojoStartFreshAction
        counts={{
          arrangements: 1,
          sessions: 2,
        }}
        isConfirming={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onDownloadBackup={() => undefined}
        onRequestConfirm={() => undefined}
      />,
    );

    expect(markup).toContain('data-tone="neutral"');
    expect(markup).not.toContain('data-tone="danger"');
  });

  it("summarizes the contents and impact of a pending restore", () => {
    const backup = createRestoreBackup();
    const formattedExportDate = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(backup.exportedAt));
    const markup = renderToStaticMarkup(
      <DojoRestoreAction
        backup={backup}
        onCancel={() => undefined}
        onChooseBackup={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(markup).toContain("Restore this Dojo backup?");
    expect(markup).toContain(`Exported: ${formattedExportDate}`);
    expect(markup).toContain("2 Sessions • 1 Arrangement");
    expect(markup).toContain("3 Custom Tunings • 4 Custom Chord Progressions");
    expect(markup).toContain("Your preferences will also be replaced.");
    expect(markup).toContain("Cancel");
    expect(markup).toContain("Restore Backup");
    expect(markup).toContain('data-tone="danger"');
  });
});
