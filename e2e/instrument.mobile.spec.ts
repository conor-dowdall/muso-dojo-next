import { expect, test } from "@playwright/test";
import { seedDojoWorkspace } from "./fixtures/dojo";

test("the instrument remains usable with touch input on a phone viewport", async ({
  page,
}) => {
  await seedDojoWorkspace(page);
  await page.goto("/dojo");

  await page.getByRole("button", { name: "Edit notes", exact: true }).click();
  const key = page.getByRole("button", { name: /MIDI 49/ });
  await expect(key).toBeVisible();

  const pressedBefore = await key.getAttribute("aria-pressed");
  await key.tap();

  await expect(key).toHaveAttribute("data-pointer-modality", "touch");
  await expect(key).toHaveAttribute(
    "aria-pressed",
    pressedBefore === "true" ? "false" : "true",
  );
  await expect(
    page.getByRole("button", { name: "Add to session", exact: true }),
  ).toBeVisible();
});
