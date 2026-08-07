import { expect, test, type Page } from "@playwright/test";
import {
  createDojoBackupJson,
  createKeyboardWorkspaceSnapshot,
  expectWorkspacePersisted,
  seedDojoWorkspace,
} from "./fixtures/dojo";

const exportedAt = "2026-07-26T14:30:22.000Z";

function createReplacementSnapshot() {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const session = snapshot.sessions["e2e-session"];

  if (!session) {
    throw new Error("Expected the browser fixture Session to exist");
  }

  snapshot.sessions["e2e-session"] = {
    ...session,
    name: "Restored Session",
  };
  snapshot.sessions["second-session"] = {
    ...session,
    id: "second-session",
    name: "Second Restored Session",
  };
  snapshot.arrangements["restored-arrangement"] = {
    entries: [],
    id: "restored-arrangement",
    lastModified: "2026-07-26T14:30:22.000Z",
    name: "Restored Arrangement",
    playbackMode: "once",
    sections: [],
    tempoBpm: 80,
  };
  snapshot.dojoSettings = {
    appTheme: "purple",
    customChordProgressions: [
      {
        id: "progression-1",
        name: "Restored Progression",
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
        id: "tuning-1",
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
      {
        id: "tuning-2",
        instrument: "bassGuitar",
        name: "Drop D",
        openMidiNotes: [38, 45, 50, 55],
      },
    ],
  };

  return snapshot;
}

async function openDojoSettings(page: Page) {
  await page.getByRole("button", { name: "Session menu" }).click();
  await page.getByRole("button", { name: "Dojo Settings" }).click();

  const settings = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: "Dojo Settings" }),
  });
  await expect(settings).toBeVisible();

  return settings;
}

async function chooseBackupFile(page: Page, contents: string) {
  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(contents),
    mimeType: "application/json",
    name: "muso-dojo-backup-test.json",
  });
}

test.beforeEach(async ({ page }) => {
  await seedDojoWorkspace(page);
  await page.goto("/dojo");
  await expect(
    page.getByRole("heading", { name: "Browser Session" }),
  ).toBeVisible();
});

test("summarizes a backup and cancellation leaves the Dojo unchanged", async ({
  page,
}) => {
  const settings = await openDojoSettings(page);
  await chooseBackupFile(
    page,
    createDojoBackupJson(createReplacementSnapshot(), exportedAt),
  );

  const confirmation = settings.getByRole("group", {
    name: "Restore this Dojo backup?",
  });
  const formattedExportDate = await page.evaluate(
    (date) =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date)),
    exportedAt,
  );

  await expect(confirmation).toContainText(`Exported: ${formattedExportDate}`);
  await expect(confirmation).toContainText("2 Sessions • 1 Arrangement");
  await expect(confirmation).toContainText(
    "2 Custom Tunings • 1 Custom Chord Progression",
  );
  await expect(confirmation).toContainText(
    "Your preferences will also be replaced.",
  );

  await confirmation.getByRole("button", { name: "Cancel" }).click();

  await expect(confirmation).toHaveCount(0);
  await expect(
    settings.getByRole("button", {
      name: "Choose a Dojo backup JSON file to restore",
    }),
  ).toBeVisible();
  await expectWorkspacePersisted(
    page,
    (snapshot) => snapshot.sessions["e2e-session"]?.name === "Browser Session",
  );
});

test("rejects an invalid backup without showing confirmation", async ({
  page,
}) => {
  const settings = await openDojoSettings(page);
  await chooseBackupFile(page, "{not-json");

  await expect(settings.getByRole("alert")).toHaveText(
    "The selected file is not valid JSON.",
  );
  await expect(
    settings.getByRole("group", { name: "Restore this Dojo backup?" }),
  ).toHaveCount(0);
  await expect(
    settings.getByRole("button", {
      name: "Choose a Dojo backup JSON file to restore",
    }),
  ).toBeVisible();
});

test("restores the backup as a complete replacement", async ({ page }) => {
  const settings = await openDojoSettings(page);
  await chooseBackupFile(
    page,
    createDojoBackupJson(createReplacementSnapshot(), exportedAt),
  );

  await settings.getByRole("button", { name: "Restore Backup" }).click();

  await expect(settings).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Restored Session" }),
  ).toBeVisible();
  await expectWorkspacePersisted(
    page,
    (snapshot) =>
      Object.keys(snapshot.sessions).length === 2 &&
      Object.keys(snapshot.arrangements).length === 1 &&
      snapshot.sessions["e2e-session"]?.name === "Restored Session" &&
      snapshot.dojoSettings.appTheme === "purple" &&
      snapshot.dojoSettings.customFretboardTunings?.length === 2 &&
      snapshot.dojoSettings.customChordProgressions?.length === 1,
  );
});
