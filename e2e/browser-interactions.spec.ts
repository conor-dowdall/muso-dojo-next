import { expect, test } from "@playwright/test";
import { seedDojoWorkspace } from "./fixtures/dojo";

test.beforeEach(async ({ page }) => {
  await seedDojoWorkspace(page);
  await page.goto("/dojo");
  await expect(
    page.getByRole("heading", { name: "Browser Session" }),
  ).toBeVisible();
});

test("native dialogs contain global shortcuts and release page scrolling", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Choose view. Current: Session" })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "View" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");

  await page.keyboard.press("Shift+Space");
  await expect(
    page.getByRole("button", { name: "Play Session" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
  await expect(
    page.locator('[data-session-view-mode="session"]'),
  ).toBeVisible();
});

test("Part playback options expose Session and Part-loop transports", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: /Playback options for Part/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Playback for Part" });

  await expect(
    dialog.getByRole("button", { name: /^Backing Notes/ }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: /^Rhythm source/ }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Play Session from this Part" })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Stop Session" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Stop Session" }).click();
  await dialog.getByRole("button", { name: "Loop Part" }).click();
  await expect(
    dialog.getByRole("button", { name: "Stop Part Loop" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Stop Part Loop" }).click();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
});

test("Playback surfaces and new module sources use scoped language", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Playback options for Session" })
    .click();
  const playbackDialog = page.getByRole("dialog", {
    name: "Playback for Session",
  });
  await expect(playbackDialog).toBeVisible();
  await playbackDialog
    .getByRole("button", { name: "Close", exact: true })
    .click();

  await page
    .getByRole("button", { name: "Add to session", exact: true })
    .click();
  const addDialog = page.getByRole("dialog", { name: "Add to Session" });
  await addDialog.getByRole("button", { name: "Add Looper module" }).click();
  await expect(addDialog.getByText(/Backing Notes Source/)).toBeVisible();
  await addDialog.getByRole("button", { name: "Add Rhythm module" }).click();
  await expect(addDialog.getByText(/Rhythm Source/)).toBeVisible();
});

test("custom choices separate selection from configuration", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page.getByRole("button", { name: "Dojo Settings" }).click();

  const settingsDialog = page.getByRole("dialog", { name: "Dojo Settings" });
  await settingsDialog
    .getByRole("button", { name: /^Choose Note Colors/ })
    .click();

  const customColorSettings = settingsDialog.getByRole("button", {
    name: "Custom Note Colors settings",
  });
  await expect(customColorSettings).toBeDisabled();
  await settingsDialog
    .getByRole("button", { name: /^Use Custom Note Colors/ })
    .click();
  await expect(customColorSettings).toBeEnabled();
  await expect(
    settingsDialog.getByRole("group", { name: "Custom color mode" }),
  ).not.toBeVisible();
  await customColorSettings.click();
  await expect(
    settingsDialog.getByRole("group", { name: "Custom color mode" }),
  ).toBeVisible();
  await settingsDialog
    .getByRole("button", { name: "Close", exact: true })
    .last()
    .click();

  await page
    .getByRole("button", { name: "Add to session", exact: true })
    .click();
  const addDialog = page.getByRole("dialog", { name: "Add to Session" });
  const addFretboard = addDialog.getByRole("button", {
    name: "Add Fretboard module",
  });
  const removeFretboard = addDialog.getByRole("button", {
    name: "Remove Fretboard module",
  });
  await expect(addFretboard.or(removeFretboard)).toBeVisible();
  if (await addFretboard.isVisible()) {
    await addFretboard.click();
  }
  await addDialog.getByRole("button", { name: "Fretboard settings" }).click();
  await addDialog.getByRole("button", { name: /^Choose appearance/ }).click();

  const customAppearanceSettings = addDialog.getByRole("button", {
    name: "Custom Appearance settings",
  });
  await expect(customAppearanceSettings).toBeDisabled();
  await addDialog
    .getByRole("button", { name: /^Use Custom Appearance/ })
    .click();
  await expect(customAppearanceSettings).toBeEnabled();
  await expect(
    addDialog.getByRole("button", { name: /^Wood\. Current:/ }),
  ).not.toBeVisible();
  await customAppearanceSettings.click();
  await expect(
    addDialog.getByRole("button", { name: /^Wood\. Current:/ }),
  ).toBeVisible();
});

test("keyboard notes use roving focus and respond to keyboard activation", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit notes", exact: true }).click();
  const firstKey = page.getByRole("button", { name: /MIDI 48/ });
  const nextKey = page.getByRole("button", { name: /MIDI 49/ });

  await firstKey.focus();
  await expect(firstKey).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(nextKey).toBeFocused();

  const pressedBefore = await nextKey.getAttribute("aria-pressed");
  await page.keyboard.press("Enter");
  await expect(nextKey).toHaveAttribute(
    "aria-pressed",
    pressedBefore === "true" ? "false" : "true",
  );
});
