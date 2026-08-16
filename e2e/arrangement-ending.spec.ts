import { expect, test } from "@playwright/test";
import {
  createKeyboardWorkspaceSnapshot,
  expectWorkspacePersisted,
  seedDojoWorkspace,
} from "./fixtures/dojo";

const arrangementId = "ending-arrangement";

function createArrangementSnapshot() {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const session = snapshot.sessions["e2e-session"]!;
  snapshot.activeSessionId = null;
  snapshot.activeWorkspace = { id: arrangementId, kind: "arrangement" };
  snapshot.arrangements = {
    [arrangementId]: {
      entries: [{ id: "entry", playCount: 1, sectionId: "section" }],
      id: arrangementId,
      lastModified: "2026-08-16T10:00:00.000Z",
      name: "Ending Arrangement",
      playbackMode: "once",
      sections: [
        {
          backingBand: session.backingBand!,
          id: "section",
          parts: session.parts,
          source: {
            capturedAt: "2026-08-16T10:00:00.000Z",
            sessionId: session.id,
            sessionLastModified: session.lastModified,
            sessionName: session.name,
            sessionTempoBpm: 80,
          },
        },
      ],
      tempoBpm: 80,
      workspaceViewMode: "build",
    },
  };

  return snapshot;
}

test("configures and persists a Band Ending from the Arrangement Menu", async ({
  page,
}) => {
  await seedDojoWorkspace(page, createArrangementSnapshot());
  await page.goto("/dojo");
  const menuButton = page.getByRole("button", { name: "Arrangement menu" });

  await menuButton.click();
  await page.getByRole("button", { name: "Ending. Current: Off" }).click();
  await page.getByRole("button", { name: "Use Band Ending" }).click();

  await expect(
    page.getByText("Kick and crash with a sustained ending note."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Band Ending settings" }).click();

  await expect(
    page.getByRole("button", { name: "Choose ending note, C selected" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Playback sound. Current: Acoustic Bass",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Octave. Current: Octave 2" }),
  ).toBeVisible();
  await expectWorkspacePersisted(
    page,
    (snapshot) =>
      snapshot.arrangements[arrangementId]?.ending?.rootNote === "C",
  );

  await page.keyboard.press("Escape");
  await menuButton.click();
  await expect(
    page.getByRole("button", {
      name: "Ending. Current: Band Ending • C2 • Acoustic Bass",
    }),
  ).toBeVisible();
});
