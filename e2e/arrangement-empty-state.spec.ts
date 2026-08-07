import { expect, test } from "@playwright/test";
import {
  createKeyboardWorkspaceSnapshot,
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
      "Build and play music in Parts with Instruments, Loopers and more.",
    ),
  ).toBeVisible();
  await expect(
    library.getByText(
      "Build a playable arrangement by capturing your Sessions as Sections.",
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
    },
  };

  await seedDojoWorkspace(page, snapshot);
  await page.goto("/dojo");

  await expect(
    page.getByText(
      "Adding a Session captures its current Parts and backing. If the Session changes, you can update the Section later.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add First Section" }).click();

  await expect(page.getByRole("region", { name: "Section 1" })).toBeVisible();
  await expect(
    page.getByText(
      "This Section captured the Session's current Parts and backing.",
    ),
  ).toHaveCount(0);
});
