import { expect, test, type Page } from "@playwright/test";
import {
  createCollidingFretboardWorkspaceSnapshot,
  expectWorkspacePersisted,
  seedDojoWorkspace,
} from "./fixtures/dojo";

async function selectSession(page: Page, sessionName: string) {
  await page.getByRole("button", { name: "Session menu" }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page
    .getByRole("button", { name: `Use ${sessionName} session` })
    .click();
  await expect(page.getByRole("heading", { name: sessionName })).toBeVisible();
}

test("keeps custom note emphasis when sessions reuse nested entity IDs", async ({
  page,
}) => {
  const customSessionId = "custom-fretboard-session";
  const otherSessionId = "other-fretboard-session";
  const customSessionName = "Custom Fretboard Session";
  const otherSessionName = "Other Fretboard Session";

  await seedDojoWorkspace(page, createCollidingFretboardWorkspaceSnapshot());
  await page.goto("/dojo");

  const customLargeNote = page.locator(
    '[data-instrument="fretboard"] [data-emphasis="large"]',
  );
  const customSmallNote = page.locator(
    '[data-instrument="fretboard"] [data-emphasis="small"]',
  );

  await expect(
    page.getByRole("heading", { name: customSessionName }),
  ).toBeVisible();
  await expect(customLargeNote).toHaveCount(1);
  await expect(customLargeNote).toBeVisible();
  await expect(customSmallNote).toHaveCount(1);
  await expect(customSmallNote).toBeVisible();

  await selectSession(page, otherSessionName);
  await expectWorkspacePersisted(
    page,
    (snapshot) => snapshot.activeWorkspace?.id === otherSessionId,
  );

  await selectSession(page, customSessionName);
  await expect(customLargeNote).toHaveCount(1);
  await expect(customLargeNote).toBeVisible();
  await expect(customSmallNote).toHaveCount(1);
  await expect(customSmallNote).toBeVisible();
  await expectWorkspacePersisted(page, (snapshot) => {
    const partModule = snapshot.sessions[customSessionId]?.parts[0]?.modules[0];

    return (
      snapshot.activeWorkspace?.id === customSessionId &&
      partModule?.type === "instrument" &&
      partModule.instrument.activeNotes?.["0-1"]?.emphasis === "large" &&
      partModule.instrument.activeNotes?.["0-3"]?.emphasis === "small"
    );
  });

  await page.reload();
  await expect(
    page.getByRole("heading", { name: customSessionName }),
  ).toBeVisible();
  await expect(customLargeNote).toHaveCount(1);
  await expect(customLargeNote).toBeVisible();
  await expect(customSmallNote).toHaveCount(1);
  await expect(customSmallNote).toBeVisible();
});
