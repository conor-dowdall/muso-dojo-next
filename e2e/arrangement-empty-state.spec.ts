import { expect, test } from "@playwright/test";
import {
  createKeyboardWorkspaceSnapshot,
  expectWorkspacePersisted,
  seedDojoWorkspace,
} from "./fixtures/dojo";

test("an empty Arrangement directs the user to add a Part to a Session", async ({
  page,
}) => {
  await page.goto("/dojo");
  await expect(page.getByRole("heading", { name: "My Session" })).toBeVisible();

  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page.getByRole("button", { name: /^Library/ }).click();

  const library = page.getByRole("dialog");
  await expect(library.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(
    library.getByText(
      "Build and play music with Parts, Instruments, Loopers, and more.",
    ),
  ).toBeVisible();
  await expect(
    library.getByText(
      "Build and play a sequence of Sections from your Sessions.",
    ),
  ).toBeVisible();

  await library.getByRole("button", { name: /New Arrangement/ }).click();

  await expect(
    page.getByText(
      "Arrangements are built from Sessions. Add at least one Part to a Session first.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add First Section" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Open Library" }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Library" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use My Session session" }),
  ).toBeVisible();
});

test("an Arrangement without Sessions offers one route through the Library", async ({
  page,
}) => {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const arrangementId = "e2e-arrangement";
  snapshot.activeSessionId = null;
  snapshot.activeWorkspace = { id: arrangementId, kind: "arrangement" };
  snapshot.sessions = {};
  snapshot.arrangements = {
    [arrangementId]: {
      entries: [],
      id: arrangementId,
      lastModified: "2026-01-01T00:00:00.000Z",
      name: "Browser Arrangement",
      playbackMode: "once",
      sections: [],
      tempoBpm: 80,
      workspaceViewMode: "build",
    },
  };

  await seedDojoWorkspace(page, snapshot);
  await page.goto("/dojo");

  await expect(
    page.getByRole("button", { name: "Open Library" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create Session" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Open Library" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /New Session/ }),
  ).toBeVisible();
});

test("the first Section replaces the instructional empty state", async ({
  page,
}) => {
  const snapshot = createKeyboardWorkspaceSnapshot();
  const arrangementId = "e2e-arrangement";
  snapshot.activeSessionId = null;
  snapshot.activeWorkspace = { id: arrangementId, kind: "arrangement" };
  snapshot.arrangements = {
    [arrangementId]: {
      entries: [],
      id: arrangementId,
      lastModified: "2026-01-01T00:00:00.000Z",
      name: "Browser Arrangement",
      playbackMode: "once",
      sections: [],
      tempoBpm: 80,
      workspaceViewMode: "build",
    },
  };

  await seedDojoWorkspace(page, snapshot);
  await page.goto("/dojo");

  await expect(
    page.getByText(
      "Adding a Session captures its current Parts and playback settings. If the Session changes, you can update the Section later.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add First Section" }).click();

  await expect(page.getByRole("region", { name: "Section 1" })).toBeVisible();
  const headerAddSection = page
    .getByRole("group", { name: "Arrangement actions" })
    .getByRole("button", { name: "Add Section" });
  await expect(headerAddSection).toBeVisible();
  await expect(headerAddSection).toHaveText("");
  await expect(
    page.getByRole("button", { name: "Play Arrangement" }),
  ).toHaveAttribute("aria-keyshortcuts", "Shift+Space");
  await expect(
    page.getByText(
      "This Section captured the Session's current Parts and backing.",
    ),
  ).toHaveCount(0);
});

test("Section playback options persist independent tempo overrides", async ({
  page,
}) => {
  await page.goto("/dojo");
  await page
    .getByRole("button", { name: "Add to session", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Keyboard module" }).click();
  await page.getByRole("button", { name: "Add Part" }).click();
  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /New Arrangement/ })
    .click();
  await page.getByRole("button", { name: "Add First Section" }).click();

  const firstPlayback = page.getByRole("button", {
    name: /Playback options for Section 01.*80 bpm.*inherited/i,
  });
  await firstPlayback.click();
  const firstDialog = page.getByRole("dialog", {
    name: "Playback for Section 01",
  });
  await expect(
    firstDialog.getByText("Arrangement Tempo • 80 BPM"),
  ).toBeVisible();
  await firstDialog
    .getByRole("button", { name: "Play Arrangement from Section 01" })
    .click();
  await expect(
    firstDialog.getByRole("button", { name: "Stop Arrangement" }),
  ).toBeVisible();
  await firstDialog.getByRole("button", { name: "Stop Arrangement" }).click();
  await firstDialog.getByRole("button", { name: "Loop Section 01" }).click();
  await expect(
    firstDialog.getByRole("button", { name: "Stop Section Loop" }),
  ).toBeVisible();
  await firstDialog.getByRole("button", { name: "Stop Section Loop" }).click();
  await firstDialog
    .getByRole("button", { name: /^Tempo for Section 01/ })
    .click();
  await firstDialog
    .getByRole("button", { name: /^Use a Section tempo override/ })
    .click();
  await firstDialog
    .getByRole("button", { name: "Override tempo settings" })
    .click();
  await firstDialog
    .getByRole("spinbutton", { name: "Exact tempo in beats per minute" })
    .fill("126");
  await firstDialog.getByRole("button", { name: "Close", exact: true }).click();

  await expect(
    page.getByRole("button", {
      name: /Playback options for Section 01.*126 bpm.*override/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Duplicate Section 1" }).click();
  const secondPlayback = page.getByRole("button", {
    name: /Playback options for Section 02.*126 bpm.*override/i,
  });
  await secondPlayback.click();
  const secondDialog = page.getByRole("dialog", {
    name: "Playback for Section 02",
  });
  await secondDialog
    .getByRole("button", { name: /^Tempo for Section 02/ })
    .click();
  await secondDialog
    .getByRole("button", { name: "Override tempo settings" })
    .click();
  await secondDialog
    .getByRole("spinbutton", { name: "Exact tempo in beats per minute" })
    .fill("140");
  await secondDialog
    .getByRole("button", { name: "Close", exact: true })
    .click();

  await expectWorkspacePersisted(page, (snapshot) => {
    const entries = Object.values(snapshot.arrangements)[0]?.entries;
    return (
      entries?.[0]?.tempoOverrideBpm === 126 &&
      entries?.[1]?.tempoOverrideBpm === 140
    );
  });
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: /Playback options for Section 01.*126 bpm.*override/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Playback options for Section 02.*140 bpm.*override/i,
    }),
  ).toBeVisible();
});

test("each Arrangement retains its own workspace view across switching and reload", async ({
  page,
}) => {
  await page.goto("/dojo");
  await page
    .getByRole("button", { name: "Add to session", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Keyboard module" }).click();
  await page.getByRole("button", { name: "Add Part" }).click();
  await expect(page.locator('[data-instrument="keyboard"]')).toBeVisible();

  await page.getByRole("button", { name: "Session menu", exact: true }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /New Arrangement/ })
    .click();
  await page.getByRole("button", { name: "Add First Section" }).click();

  await page
    .getByRole("button", { name: "Choose view. Current: Arrangement" })
    .click();
  await page.getByRole("button", { name: "Use Chart view" }).click();
  await expect(
    page.getByRole("region", { name: "Arrangement Chart" }),
  ).toBeVisible();
  await expectWorkspacePersisted(page, (snapshot) =>
    Object.values(snapshot.arrangements).some(
      (arrangement) => arrangement.workspaceViewMode === "chart",
    ),
  );

  await page.getByRole("button", { name: "Arrangement menu" }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /New Arrangement/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "My Arrangement 2" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add First Section" }).click();
  await expect(
    page.getByRole("button", { name: "Choose view. Current: Arrangement" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Arrangement menu" }).click();
  await page.getByRole("button", { name: /^Library/ }).click();
  await page
    .getByRole("button", { name: "Use My Arrangement arrangement" })
    .click();
  await expect(
    page.getByRole("region", { name: "Arrangement Chart" }),
  ).toBeVisible();
  await expectWorkspacePersisted(page, (snapshot) => {
    const arrangements = Object.values(snapshot.arrangements);

    return (
      arrangements.find(({ name }) => name === "My Arrangement")
        ?.workspaceViewMode === "chart" &&
      arrangements.find(({ name }) => name === "My Arrangement 2")
        ?.workspaceViewMode === "build"
    );
  });

  await page.reload();

  await expect(
    page.getByRole("region", { name: "Arrangement Chart" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Choose view. Current: Chart" }),
  ).toBeVisible();
});
