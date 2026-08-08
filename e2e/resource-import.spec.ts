import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createDojoBackupJson,
  createKeyboardWorkspaceSnapshot,
  expectWorkspacePersisted,
  seedDojoWorkspace,
} from "./fixtures/dojo";

function createActiveSnapshot() {
  const snapshot = createKeyboardWorkspaceSnapshot();
  snapshot.dojoSettings = {
    appTheme: "ocean",
    customChordProgressions: [
      {
        id: "current-progression",
        name: "My Changes",
        progression: {
          chords: [
            {
              chordCollectionKey: "major",
              degree: "1",
              durationInBars: 1,
            },
          ],
        },
      },
    ],
    customFretboardTunings: [
      {
        id: "current-tuning",
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
    ],
  };

  return snapshot;
}

function createResourceBackupSnapshot() {
  const snapshot = createKeyboardWorkspaceSnapshot();
  snapshot.dojoSettings = {
    appTheme: "purple",
    customChordProgressions: [
      {
        id: "backup-collision-progression",
        name: "My Changes",
        progression: {
          chords: [
            {
              chordCollectionKey: "minor",
              degree: "4",
              durationInBars: 1,
            },
          ],
        },
      },
      {
        id: "backup-turnaround",
        name: "Turnaround",
        progression: {
          chords: [
            {
              chordCollectionKey: "dominant7",
              degree: "5",
              durationInBars: 1,
            },
          ],
        },
      },
    ],
    customFretboardTunings: [
      {
        id: "backup-open-d",
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
      {
        id: "backup-dadgad",
        instrument: "guitar",
        name: "DADGAD",
        openMidiNotes: [38, 45, 50, 55, 57, 62],
      },
    ],
  };

  return snapshot;
}

async function openLibrary(page: Page) {
  await page.getByRole("button", { name: "Session menu" }).click();
  await page.getByRole("button", { name: /^Library/ }).click();

  const library = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: "Library", exact: true }),
  });
  await expect(library).toBeVisible();

  return library;
}

async function chooseResourceBackup(library: Locator, contents: string) {
  const fileChooserPromise = library.page().waitForEvent("filechooser");
  await library
    .getByRole("button", {
      name: "Choose a Dojo backup JSON file to import resources from",
    })
    .click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    buffer: Buffer.from(contents),
    mimeType: "application/json",
    name: "muso-dojo-backup-resources.json",
  });
}

test.beforeEach(async ({ page }) => {
  await seedDojoWorkspace(page, createActiveSnapshot());
  await page.goto("/dojo");
  await expect(
    page.getByRole("heading", { name: "Browser Session" }),
  ).toBeVisible();
});

test("imports selected resources, keeps both on collision, and preserves the Dojo", async ({
  page,
}) => {
  const library = await openLibrary(page);
  const backupJson = createDojoBackupJson(
    createResourceBackupSnapshot(),
    "2026-08-07T10:30:00.000Z",
  );
  await chooseResourceBackup(library, backupJson);

  let importDialog = page
    .getByRole("dialog")
    .filter({
      has: page.getByRole("heading", { name: "Import Resources", exact: true }),
    })
    .last();
  await expect(importDialog).toBeVisible();
  await expect(importDialog.getByText("Custom Tunings")).toBeVisible();
  await expect(
    importDialog.getByText("Custom Chord Progressions"),
  ).toBeVisible();
  await expect(importDialog.getByText("Open D Copy")).toBeVisible();
  await expect(importDialog.getByText("Skip", { exact: true })).toHaveCount(2);
  await expect(importDialog.getByText("INCLUDED", { exact: true })).toHaveCount(
    2,
  );
  await expect(
    importDialog.getByRole("button", { name: "Import 2 Resources" }),
  ).toBeEnabled();

  await importDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(importDialog).toHaveCount(0);
  await expect(library).toBeVisible();
  await expectWorkspacePersisted(
    page,
    (snapshot) =>
      snapshot.dojoSettings.customFretboardTunings?.length === 1 &&
      snapshot.dojoSettings.customChordProgressions?.length === 1,
  );

  await chooseResourceBackup(library, backupJson);
  importDialog = page
    .getByRole("dialog")
    .filter({
      has: page.getByRole("heading", { name: "Import Resources", exact: true }),
    })
    .last();

  await importDialog
    .getByRole("button", {
      name: "Include backup Open D tuning as Open D Copy",
    })
    .click();
  await expect(importDialog.getByText("INCLUDED", { exact: true })).toHaveCount(
    2,
  );
  await expect(
    importDialog.getByText("KEEP BOTH", { exact: true }),
  ).toHaveCount(1);
  await expect(importDialog.getByText("Skip", { exact: true })).toHaveCount(1);
  await importDialog
    .getByRole("button", { name: "Import 3 Resources" })
    .click();

  await expect(importDialog).toHaveCount(0);
  await expect(library.getByRole("status")).toHaveText(
    "Imported 3 resources. Skipped 1 resource.",
  );
  await expectWorkspacePersisted(
    page,
    (snapshot) =>
      snapshot.sessions["e2e-session"]?.name === "Browser Session" &&
      snapshot.dojoSettings.appTheme === "ocean" &&
      snapshot.dojoSettings.customFretboardTunings?.length === 3 &&
      snapshot.dojoSettings.customFretboardTunings.some(
        ({ id, name }) => id !== "backup-open-d" && name === "Open D Copy",
      ) &&
      snapshot.dojoSettings.customFretboardTunings.some(
        ({ id, name }) => id !== "backup-dadgad" && name === "DADGAD",
      ) &&
      snapshot.dojoSettings.customChordProgressions?.length === 2 &&
      snapshot.dojoSettings.customChordProgressions.some(
        ({ id, name }) => id !== "backup-turnaround" && name === "Turnaround",
      ),
  );
});

test("rejects an invalid resource backup without opening the picker", async ({
  page,
}) => {
  const library = await openLibrary(page);
  await chooseResourceBackup(library, "{not-json");

  await expect(library.getByRole("alert")).toHaveText(
    "The selected file is not valid JSON.",
  );
  await expect(
    page.getByRole("heading", { name: "Import Resources", exact: true }),
  ).toHaveCount(0);
});
