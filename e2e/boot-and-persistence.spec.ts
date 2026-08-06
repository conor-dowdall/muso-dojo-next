import { expect, test } from "@playwright/test";
import { expectWorkspacePersisted } from "./fixtures/dojo";

test("enters the Dojo and restores a user-visible change after reload", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Begin. Enter the Dojo." }).click();

  await expect(page).toHaveURL(/\/dojo$/);
  await expect(page.getByRole("heading", { name: "My Session" })).toBeVisible();

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(
    page.getByRole("heading", { name: "Session Menu" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rename session. Current name: My Session" })
    .click();

  await page.getByRole("textbox", { name: "Session Name" }).fill("Rehearsal");
  await page.getByRole("button", { name: "Save session name" }).click();
  await expect(page.getByRole("heading", { name: "Rehearsal" })).toBeVisible();

  await expectWorkspacePersisted(
    page,
    (snapshot) => snapshot.sessions["session-1"]?.name === "Rehearsal",
  );
  await page.reload();

  await expect(page.getByRole("heading", { name: "Rehearsal" })).toBeVisible();
});
