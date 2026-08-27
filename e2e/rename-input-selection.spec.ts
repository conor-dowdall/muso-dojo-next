import { expect, test, type Locator } from "@playwright/test";
import {
  createKeyboardWorkspaceSnapshot,
  seedDojoWorkspace,
} from "./fixtures/dojo";

async function expectNameSelected(input: Locator) {
  await expect(input).toBeFocused();
  await expect(input).toHaveJSProperty("selectionStart", 0);
  await expect(input).toHaveJSProperty(
    "selectionEnd",
    await input.evaluate((element: HTMLInputElement) => element.value.length),
  );
}

test("selects the existing name in every Session and Arrangement rename input", async ({
  page,
}) => {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const arrangementId = "e2e-arrangement";
  snapshot.arrangements = {
    [arrangementId]: {
      entries: [],
      id: arrangementId,
      lastModified: "2026-01-01T00:00:00.000Z",
      name: "Browser Arrangement",
      playbackMode: "once",
      sections: [],
      tempoBpm: 80,
      workspaceViewMode: "build",
    },
  };
  await seedDojoWorkspace(page, snapshot);
  await page.goto("/dojo");

  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Rename session. Current name: Browser Session",
    })
    .click();
  await expectNameSelected(page.getByRole("textbox", { name: "Session Name" }));
  await page
    .getByRole("button", {
      name: "Rename session. Current name: Browser Session",
    })
    .click();

  await page.getByRole("button", { name: /^Library/ }).click();
  const sessionLibrary = page.getByRole("dialog", { name: "Library" });
  await sessionLibrary
    .getByRole("button", { name: "Open actions for Browser Session session" })
    .click();
  await sessionLibrary
    .getByRole("button", {
      name: "Rename session. Current name: Browser Session",
    })
    .click();
  await expectNameSelected(
    sessionLibrary.getByRole("textbox", { name: "Session Name" }),
  );
  await sessionLibrary
    .getByRole("button", {
      name: "Rename session. Current name: Browser Session",
    })
    .click();

  await sessionLibrary
    .getByRole("button", {
      name: "Open actions for Browser Arrangement arrangement",
    })
    .click();
  await sessionLibrary
    .getByRole("button", { name: "Rename Browser Arrangement arrangement" })
    .click();
  await expectNameSelected(
    sessionLibrary.getByRole("textbox", { name: "Arrangement Name" }),
  );
  await sessionLibrary
    .getByRole("button", { name: "Rename Browser Arrangement arrangement" })
    .click();
  await sessionLibrary
    .getByRole("button", { name: "Use Browser Arrangement arrangement" })
    .click();

  await page
    .getByRole("button", { name: "Arrangement menu", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Rename arrangement. Current name: Browser Arrangement",
    })
    .click();
  await expectNameSelected(
    page.getByRole("textbox", { name: "Arrangement Name" }),
  );
});
