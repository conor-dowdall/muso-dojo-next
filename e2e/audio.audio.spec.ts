import { expect, test } from "@playwright/test";
import {
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
