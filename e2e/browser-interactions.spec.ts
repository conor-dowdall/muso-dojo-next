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
    page.getByRole("button", { name: "Play Backing Band" }),
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
