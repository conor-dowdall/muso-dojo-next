import { expect, test, type Page } from "@playwright/test";
import {
  createKeyboardWorkspaceSnapshot,
  seedDojoWorkspace,
} from "./fixtures/dojo";

async function expectOnlyDialog(page: Page, name: string) {
  await expect(page.getByRole("dialog", { name })).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Close dialog" })).toHaveCount(
    1,
  );
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");
}

async function expectDialogClosedAndFocusReturned(
  page: Page,
  launcherName: string,
) {
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: launcherName })).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
}

async function openSessionMenu(page: Page) {
  const launcher = page.getByRole("button", { name: "Session menu" });
  await launcher.click();
  await expectOnlyDialog(page, "Session Menu");

  return launcher;
}

function createArrangementSnapshot() {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const arrangementId = "handoff-arrangement";
  snapshot.activeSessionId = null;
  snapshot.activeWorkspace = { id: arrangementId, kind: "arrangement" };
  snapshot.arrangements = {
    [arrangementId]: {
      entries: [],
      id: arrangementId,
      lastModified: "2026-08-07T10:30:00.000Z",
      name: "Handoff Arrangement",
      playbackMode: "once",
      sections: [],
      tempoBpm: 80,
      workspaceViewMode: "build",
    },
  };

  return snapshot;
}

test.beforeEach(async ({ page }) => {
  await seedDojoWorkspace(page);
});

test("Session Menu hands off to Library and returns focus after Escape", async ({
  page,
}) => {
  await page.goto("/dojo");
  await openSessionMenu(page);
  await page.evaluate(() => {
    const handoffWindow = window as typeof window & {
      dialogFrameCounts?: number[];
    };
    let remainingFrames = 12;
    handoffWindow.dialogFrameCounts = [];

    const sampleDialogCount = () => {
      handoffWindow.dialogFrameCounts?.push(
        document.querySelectorAll("dialog[open]").length,
      );
      remainingFrames -= 1;

      if (remainingFrames > 0) {
        requestAnimationFrame(sampleDialogCount);
      }
    };

    requestAnimationFrame(sampleDialogCount);
  });

  await page.getByRole("button", { name: /^Library/ }).click();
  await expectOnlyDialog(page, "Library");
  const libraryDialog = page.getByRole("dialog", { name: "Library" });
  await expect(libraryDialog).toHaveAttribute("data-handoff", "");
  await expect
    .poll(() =>
      libraryDialog.evaluate(
        (dialog) => getComputedStyle(dialog).animationName,
      ),
    )
    .toBe("none");
  await expect
    .poll(() =>
      libraryDialog.evaluate(
        (dialog) => getComputedStyle(dialog, "::backdrop").animationName,
      ),
    )
    .toBe("none");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { dialogFrameCounts?: number[] })
            .dialogFrameCounts,
      ),
    )
    .toHaveLength(12);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { dialogFrameCounts?: number[] })
          .dialogFrameCounts,
    ),
  ).not.toContain(0);

  await page.keyboard.press("Escape");
  await expectDialogClosedAndFocusReturned(page, "Session menu");
});

test("Session Menu hands off to Dojo Settings without duplicate modal controls", async ({
  page,
}) => {
  await page.goto("/dojo");
  await openSessionMenu(page);

  await page.getByRole("button", { name: "Dojo Settings" }).click();
  await expectOnlyDialog(page, "Dojo Settings");

  await page.keyboard.press("Escape");
  await expectDialogClosedAndFocusReturned(page, "Session menu");
});

test("Arrangement Menu hands off to Library and Settings", async ({ page }) => {
  await seedDojoWorkspace(page, createArrangementSnapshot());
  await page.goto("/dojo");
  const launcher = page.getByRole("button", { name: "Arrangement menu" });

  await launcher.click();
  await expectOnlyDialog(page, "Arrangement Menu");
  await page.getByRole("button", { name: /^Library/ }).click();
  await expectOnlyDialog(page, "Library");
  await page.keyboard.press("Escape");
  await expectDialogClosedAndFocusReturned(page, "Arrangement menu");

  await launcher.click();
  await page.getByRole("button", { name: "Dojo Settings" }).click();
  await expectOnlyDialog(page, "Dojo Settings");
  await page.keyboard.press("Escape");
  await expectDialogClosedAndFocusReturned(page, "Arrangement menu");
});

test("reduced motion removes modal animation without leaving a closing dialog", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dojo");
  await openSessionMenu(page);

  await expect
    .poll(() =>
      page
        .getByRole("dialog", { name: "Session Menu" })
        .evaluate((dialog) => getComputedStyle(dialog).animationName),
    )
    .toBe("none");

  await page.keyboard.press("Escape");
  await expectDialogClosedAndFocusReturned(page, "Session menu");
  await expect(page.locator('dialog[data-state="closing"][open]')).toHaveCount(
    0,
  );
});

test("Library drill-in returns focus to its resource entry", async ({
  page,
}) => {
  await page.goto("/dojo");
  await openSessionMenu(page);
  await page.getByRole("button", { name: /^Library/ }).click();
  const tuningEntry = page.getByRole("button", { name: /^My Tunings/ });

  await tuningEntry.click();
  await expect(page.getByRole("dialog", { name: "My Tunings" })).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog", { name: "Library" })).toBeVisible();
  await expect(tuningEntry).toBeFocused();
});
