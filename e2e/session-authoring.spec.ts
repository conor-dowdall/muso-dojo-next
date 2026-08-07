import { expect, test } from "@playwright/test";

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
});
