import { expect, test } from "@playwright/test";
import { waitForServiceWorkerControl } from "./fixtures/dojo";

test("the installed app serves the Dojo and fallback while offline", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await waitForServiceWorkerControl(page);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cacheNames = await caches.keys();
        const cachedRequests = (
          await Promise.all(
            cacheNames.map(async (cacheName) =>
              (await caches.open(cacheName)).keys(),
            ),
          )
        ).flat();

        return cachedRequests.some(
          (request) => new URL(request.url).pathname === "/dojo",
        );
      }),
    )
    .toBe(true);

  await context.setOffline(true);

  await page.goto("/dojo");
  await expect(page.getByRole("heading", { name: "My Session" })).toBeVisible();

  await page.goto("/not-available-offline");
  await expect(page.getByText("Offline Mode", { exact: true })).toBeVisible();
  await page
    .getByRole("link", {
      name: "Begin. Enter the saved Dojo while offline.",
    })
    .click();
  await expect(page).toHaveURL(/\/dojo$/);
  await expect(page.getByRole("heading", { name: "My Session" })).toBeVisible();
});
