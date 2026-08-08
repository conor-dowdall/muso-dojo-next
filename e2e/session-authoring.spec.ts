import { expect, test } from "@playwright/test";
import {
  createKeyboardWorkspaceSnapshot,
  expectWorkspacePersisted,
  seedDojoWorkspace,
} from "./fixtures/dojo";

test("creates a playable module and moves through session views", async ({
  page,
}) => {
  await page.goto("/dojo");
  await expect(page.getByRole("heading", { name: "My Session" })).toBeVisible();
  await expect(
    page.getByText(
      "Add individual Parts or a Chord Progression to start building this Session.",
    ),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Add to session", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Add to Session" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add Keyboard module" }).click();
  await expect(
    page.getByRole("button", { name: "Remove Keyboard module" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add Part" }).click();

  await expect(page.locator('[data-instrument="keyboard"]')).toBeVisible();

  await page
    .getByRole("button", { name: "Choose view. Current: Session" })
    .click();
  await page.getByRole("button", { name: "Use Chart view" }).click();
  await expect(page.getByRole("region", { name: "Chart View" })).toBeVisible();

  await page
    .getByRole("button", { name: "Choose view. Current: Chart" })
    .click();
  await page.getByRole("button", { name: "Use Live view" }).click();
  await expect(page.locator('[data-session-view-mode="live"]')).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-session-view-mode="chart"]')).toBeVisible();
  await expect(page.getByRole("region", { name: "Chart View" })).toBeVisible();

  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /New Session/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "My Session 2" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to session", exact: true })
    .click();
  const addKeyboard = page.getByRole("button", {
    name: "Add Keyboard module",
  });
  const removeKeyboard = page.getByRole("button", {
    name: "Remove Keyboard module",
  });
  await expect(addKeyboard.or(removeKeyboard)).toBeVisible();
  if (await addKeyboard.isVisible()) {
    await addKeyboard.click();
  }
  await page.getByRole("button", { name: "Add Part" }).click();
  await expect(
    page.getByRole("button", { name: "Choose view. Current: Session" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page.getByRole("button", { name: "Use My Session session" }).click();
  await expect(page.getByRole("region", { name: "Chart View" })).toBeVisible();
  await expectWorkspacePersisted(page, (snapshot) => {
    const sessions = Object.values(snapshot.sessions);

    return (
      sessions.find(({ name }) => name === "My Session")?.workspaceViewMode ===
        "chart" &&
      sessions.find(({ name }) => name === "My Session 2")
        ?.workspaceViewMode === "session"
    );
  });

  await page.reload();
  await expect(page.getByRole("region", { name: "Chart View" })).toBeVisible();
});

test("an unavailable Chart falls back without erasing the Session preference", async ({
  page,
}) => {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const session = snapshot.sessions["e2e-session"]!;
  session.parts = [];
  session.workspaceViewMode = "chart";

  await seedDojoWorkspace(page, snapshot);
  await page.goto("/dojo");

  await expect(
    page.locator('[data-session-view-mode="session"]'),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to session", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Keyboard module" }).click();
  await page.getByRole("button", { name: "Add Part" }).click();

  await expect(page.locator('[data-session-view-mode="chart"]')).toBeVisible();
  await expectWorkspacePersisted(
    page,
    (persisted) =>
      persisted.sessions["e2e-session"]?.workspaceViewMode === "chart",
  );
});
