import { expect, test } from "@playwright/test";
import {
  createKeyboardWorkspaceSnapshot,
  expectWorkspacePersisted,
  seedDojoWorkspace,
  seedDojoWorkspaceOnce,
} from "./fixtures/dojo";

test("keyboard note edits can be reset, locked, and unlocked", async ({
  page,
}) => {
  await seedDojoWorkspace(page);
  await page.goto("/dojo");

  await page.getByRole("button", { name: "Edit notes", exact: true }).click();
  const cSharp = page.getByRole("button", { name: /MIDI 49/ });
  await expect(cSharp).toHaveAttribute("aria-pressed", "false");

  await cSharp.click();
  await expect(cSharp).toHaveAttribute("aria-pressed", "true");
  const reset = page.getByRole("button", { name: "Reset custom edits" });
  await expect(reset).toBeEnabled();
  await reset.click();
  await expect(cSharp).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: "No custom edits" }),
  ).toBeDisabled();

  await cSharp.click();
  await page.getByRole("button", { name: "Lock current notes" }).click();
  await expect(page.getByRole("button", { name: "Edit notes" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Edit all matching notes" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Change note size/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Play notes" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expectWorkspacePersisted(page, (snapshot) => {
    const instrumentModule =
      snapshot.sessions["e2e-session"]?.parts[0]?.modules[0];

    return (
      instrumentModule?.type === "instrument" &&
      instrumentModule.instrument.activeNotesLocked === true &&
      instrumentModule.instrument.activeNotes?.["49"]?.midi === 49
    );
  });

  await page.getByRole("button", { name: "Unlock notes" }).click();
  await expect(
    page.getByRole("button", { name: "Edit notes", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /Change note size/ }),
  ).toBeEnabled();
  await expectWorkspacePersisted(page, (snapshot) => {
    const instrumentModule =
      snapshot.sessions["e2e-session"]?.parts[0]?.modules[0];

    return (
      instrumentModule?.type === "instrument" &&
      instrumentModule.instrument.activeNotesLocked !== true
    );
  });
});

test("hidden keyboard notes retain an accessible focus and edit cycle", async ({
  page,
}) => {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const instrumentModule =
    snapshot.sessions["e2e-session"]?.parts[0]?.modules[0];

  if (instrumentModule?.type !== "instrument") {
    throw new Error("Expected the fixture to contain an instrument");
  }

  instrumentModule.instrument.noteEmphasis = "hidden";
  await seedDojoWorkspace(page, snapshot);
  await page.goto("/dojo");

  await page.getByRole("button", { name: "Edit notes", exact: true }).click();
  const keyboard = page.locator('[data-instrument="keyboard"]');
  const firstKey = keyboard.getByRole("button", { name: /MIDI 48/ });
  const hiddenKey = keyboard.getByRole("button", { name: /MIDI 49/ });

  await expect(keyboard.locator('button[tabindex="0"]')).toHaveCount(1);
  await firstKey.focus();
  await page.keyboard.press("ArrowRight");
  await expect(hiddenKey).toBeFocused();
  await expect(keyboard.locator('button[tabindex="0"]')).toHaveCount(1);
  await expect(hiddenKey).toHaveAttribute("tabindex", "0");
  await expect
    .poll(() =>
      hiddenKey.locator("[data-note-color-index]").evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          opacity: Number(style.opacity),
          scale: Number(style.getPropertyValue("--note-scale")),
          visibility: style.visibility,
        };
      }),
    )
    .toEqual({ opacity: 1, scale: 1, visibility: "visible" });

  await page.keyboard.press("Enter");
  await expect(hiddenKey).toHaveAttribute("aria-pressed", "true");
  await expect(hiddenKey.locator('[data-emphasis="large"]')).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(hiddenKey.locator('[data-emphasis="small"]')).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(hiddenKey).toHaveAttribute("aria-pressed", "false");
  await expect(hiddenKey.locator('[data-emphasis="hidden"]')).toHaveCount(1);
});

test("keyboard display, appearance, and size choices persist", async ({
  page,
}) => {
  await seedDojoWorkspaceOnce(page);

  await page
    .getByRole("button", { name: /Change note labels. Current:/ })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: /^MIDI/ }).click();
  await expect(
    page.getByRole("button", { name: "Change note labels. Current: MIDI" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: /White key, MIDI 48/ })
      .locator("[data-note-color-index]"),
  ).toContainText("48");

  await page.getByRole("button", { name: "Instrument options" }).click();
  const dialog = page.getByRole("dialog", { name: "Instrument Options" });
  await dialog
    .getByRole("button", { name: /Appearance. Current: Classic/ })
    .click();
  await dialog.getByRole("button", { name: /^Studio/ }).click();
  await dialog
    .getByRole("button", { name: /Instrument size. Current: Comfortable/ })
    .click();
  await dialog.getByRole("button", { name: /^Compact/ }).click();
  await page.keyboard.press("Escape");

  await expectWorkspacePersisted(page, (snapshot) => {
    const instrumentModule =
      snapshot.sessions["e2e-session"]?.parts[0]?.modules[0];

    return (
      instrumentModule?.type === "instrument" &&
      instrumentModule.instrument.displayFormatId === "midi" &&
      instrumentModule.instrument.type === "keyboard" &&
      instrumentModule.instrument.theme === "studio" &&
      instrumentModule.instrument.layout?.size === "compact"
    );
  });

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Change note labels. Current: MIDI" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Instrument options" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Instrument Options" })
      .getByRole("button", { name: /Appearance. Current: Studio/ }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog", { name: "Instrument Options" })
      .getByRole("button", { name: /Instrument size. Current: Compact/ }),
  ).toBeVisible();
});

test("left-handed fretboard navigation follows the rendered direction", async ({
  page,
}) => {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const part = snapshot.sessions["e2e-session"]?.parts[0];

  if (!part) {
    throw new Error("Expected the fixture to contain a Part");
  }

  part.modules = [
    {
      id: "e2e-fretboard",
      instrument: {
        config: {
          fretRange: [5, 7],
          instrument: "guitar",
          leftHanded: true,
          tuning: [60, 64],
          tuningName: "Test tuning",
        },
        type: "fretboard",
      },
      type: "instrument",
    },
  ];

  await seedDojoWorkspace(page, snapshot);
  await page.goto("/dojo");
  await page.getByRole("button", { name: "Edit notes", exact: true }).click();
  const fretboard = page.locator('[data-instrument="fretboard"]');
  const start = fretboard.getByRole("button", {
    name: /String 1, Fret 5/,
  });
  const visuallyLeft = fretboard.getByRole("button", {
    name: /String 1, Fret 6/,
  });
  const nextString = fretboard.getByRole("button", {
    name: /String 2, Fret 6/,
  });

  await start.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(visuallyLeft).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(nextString).toBeFocused();
  await expect(fretboard.locator('button[tabindex="0"]')).toHaveCount(1);

  const pressedBefore = await nextString.getAttribute("aria-pressed");
  await page.keyboard.press("Enter");
  await expect(nextString).toHaveAttribute(
    "aria-pressed",
    pressedBefore === "true" ? "false" : "true",
  );
});
