import { expect, test, type Locator } from "@playwright/test";
import {
  createCollidingLooperWorkspaceSnapshot,
  createKeyboardWorkspaceSnapshot,
  seedDojoWorkspace,
  waitForServiceWorkerControl,
} from "./fixtures/dojo";

async function expectNotePresentation(
  note: Locator,
  expected: { opacity: number; scale: number },
) {
  const noteVisual = note.locator("[data-note-color-index]");

  await expect
    .poll(() =>
      noteVisual.evaluate((element) => {
        const style = getComputedStyle(element);

        return {
          opacity: Number(style.opacity),
          scale: Number(style.getPropertyValue("--note-scale")),
        };
      }),
    )
    .toEqual(expected);
}

test("a browser gesture prepares samples and gives consistent note playback feedback", async ({
  context,
  page,
}) => {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const keyboardModule = snapshot.sessions["e2e-session"]?.parts[0]?.modules[0];

  if (keyboardModule?.type !== "instrument") {
    throw new Error(
      "Expected the browser test fixture to contain an instrument",
    );
  }

  keyboardModule.instrument.noteEmphasis = "hidden";
  keyboardModule.instrument.activeNotes = {
    "48": { emphasis: "small", midi: 48 },
    "50": { midi: 50 },
  };

  await seedDojoWorkspace(page, snapshot);
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
  const smallNote = page.getByRole("button", {
    name: /Play White key, MIDI 48/,
  });
  const hiddenNote = page.getByRole("button", {
    name: /Play White key, MIDI 50/,
  });

  await expectNotePresentation(smallNote, { opacity: 0.7, scale: 0.7 });
  await smallNote.click();
  await expect(smallNote).toHaveAttribute("data-note-highlighted", "true");
  await expectNotePresentation(smallNote, { opacity: 1, scale: 1 });
  await expect(smallNote).not.toHaveAttribute("data-note-highlighted", "true");
  await expectNotePresentation(smallNote, { opacity: 0.7, scale: 0.7 });

  await expectNotePresentation(hiddenNote, { opacity: 0, scale: 0 });
  await hiddenNote.click();
  await expect(hiddenNote).toHaveAttribute("data-note-highlighted", "true");
  await expectNotePresentation(hiddenNote, { opacity: 1, scale: 1 });
  await expect(hiddenNote).not.toHaveAttribute("data-note-highlighted", "true");
  await expectNotePresentation(hiddenNote, { opacity: 0, scale: 0 });

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
