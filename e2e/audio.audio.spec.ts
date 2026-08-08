import { expect, test } from "@playwright/test";
import {
  createCollidingLooperWorkspaceSnapshot,
  seedDojoWorkspace,
  waitForServiceWorkerControl,
} from "./fixtures/dojo";

test("a browser gesture prepares samples and auditions an instrument note", async ({
  context,
  page,
}) => {
  await seedDojoWorkspace(page);
  const failedAudioResponses: string[] = [];
  context.on("response", (response) => {
    if (response.url().includes("/audio/") && !response.ok()) {
      failedAudioResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  const pianoResponse = context.waitForEvent("response", {
    predicate: (response) =>
      response.url().endsWith("/audio/v1/piano.ogg") && response.ok(),
    timeout: 120_000,
  });

  await page.goto("/dojo");
  await waitForServiceWorkerControl(page);
  await pianoResponse;

  await page.getByRole("button", { name: "Play notes" }).click();
  const note = page.getByRole("button", { name: /Play White key, MIDI 48/ });
  await note.click();

  await expect(note).toHaveAttribute("data-note-highlighted", "true");
  expect(failedAudioResponses).toEqual([]);
});

test("switching Sessions retires Looper audio and UI state even when module IDs collide", async ({
  context,
  page,
}) => {
  await seedDojoWorkspace(page, createCollidingLooperWorkspaceSnapshot());
  const pianoResponse = context.waitForEvent("response", {
    predicate: (response) =>
      response.url().endsWith("/audio/v1/piano.ogg") && response.ok(),
    timeout: 120_000,
  });

  await page.goto("/dojo");
  await waitForServiceWorkerControl(page);
  await pianoResponse;

  await page
    .getByRole("button", { name: "Play exercise", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop exercise", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Use A Minor Looper Session session" })
    .click();

  await expect(
    page.getByRole("heading", { name: "A Minor Looper Session" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play exercise", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-note-highlighted="true"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Stop exercise", exact: true }),
  ).toHaveCount(0);
});
