import { expect, type Page } from "@playwright/test";
import { type AppStoreSnapshot } from "../../src/types/session";

const APP_STORE_STORAGE_KEY = "muso-dojo-app-store";
const APP_STORE_VERSION = 15;
const DOJO_BACKUP_FORMAT_VERSION = 1;
const DOJO_BACKUP_KIND = "muso-dojo-backup";

const backingBand = {
  countInBeats: 4,
  looper: {
    audioPresetId: "acoustic-bass",
    enabled: true,
    octaveOffset: -1,
  },
  rhythm: {
    mode: "automatic",
    selection: {
      recipe: {
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    },
  },
} as const;

export function createKeyboardWorkspaceSnapshot(): AppStoreSnapshot {
  const sessionId = "e2e-session";

  return {
    activeSessionId: sessionId,
    activeWorkspace: { id: sessionId, kind: "session" },
    arrangements: {},
    dojoSettings: {},
    sessions: {
      [sessionId]: {
        backingBand,
        id: sessionId,
        lastModified: "2026-01-01T00:00:00.000Z",
        name: "Browser Session",
        workspaceViewMode: "session",
        parts: [
          {
            automaticRhythm: { style: "standard" },
            id: "e2e-part",
            modules: [
              {
                id: "e2e-keyboard",
                instrument: { type: "keyboard" },
                type: "instrument",
              },
            ],
            noteCollectionKey: "major",
            rootNote: "C",
          },
        ],
      },
    },
  };
}

export function createCollidingFretboardWorkspaceSnapshot(): AppStoreSnapshot {
  const customSessionId = "custom-fretboard-session";
  const otherSessionId = "other-fretboard-session";
  const sharedPartId = "shared-part";
  const sharedModuleId = "shared-module";

  return {
    activeSessionId: customSessionId,
    activeWorkspace: { id: customSessionId, kind: "session" },
    arrangements: {},
    dojoSettings: {},
    sessions: {
      [customSessionId]: {
        backingBand,
        id: customSessionId,
        lastModified: "2026-01-01T00:00:00.000Z",
        name: "Custom Fretboard Session",
        workspaceViewMode: "session",
        parts: [
          {
            automaticRhythm: { style: "standard" },
            id: sharedPartId,
            modules: [
              {
                id: sharedModuleId,
                instrument: {
                  activeNotes: {
                    "0-1": { emphasis: "large", midi: 65 },
                    "0-3": { emphasis: "small", midi: 67 },
                  },
                  noteEmphasis: "hidden",
                  type: "fretboard",
                },
                type: "instrument",
              },
            ],
            noteCollectionKey: "major",
            rootNote: "C",
          },
        ],
      },
      [otherSessionId]: {
        backingBand,
        id: otherSessionId,
        lastModified: "2026-01-01T00:00:00.000Z",
        name: "Other Fretboard Session",
        workspaceViewMode: "session",
        parts: [
          {
            automaticRhythm: { style: "standard" },
            id: sharedPartId,
            modules: [
              {
                id: sharedModuleId,
                instrument: { type: "fretboard" },
                type: "instrument",
              },
            ],
            noteCollectionKey: "major",
            rootNote: "D",
          },
        ],
      },
    },
  };
}

export function createCollidingLooperWorkspaceSnapshot(): AppStoreSnapshot {
  const cMajorSessionId = "c-major-looper-session";
  const aMinorSessionId = "a-minor-looper-session";
  const sharedPartId = "shared-looper-part";
  const sharedModuleId = "shared-looper-module";

  const createSession = ({
    id,
    name,
    noteCollectionKey,
    rootNote,
  }: {
    id: string;
    name: string;
    noteCollectionKey: "major" | "minor";
    rootNote: "A" | "C";
  }) => ({
    backingBand,
    id,
    lastModified: "2026-01-01T00:00:00.000Z",
    name,
    workspaceViewMode: "session" as const,
    parts: [
      {
        automaticRhythm: { style: "standard" as const },
        id: sharedPartId,
        modules: [
          {
            audioPresetId: "piano" as const,
            id: sharedModuleId,
            type: "exercise-looper" as const,
          },
        ],
        noteCollectionKey,
        rootNote,
      },
    ],
  });

  return {
    activeSessionId: cMajorSessionId,
    activeWorkspace: { id: cMajorSessionId, kind: "session" },
    arrangements: {},
    dojoSettings: {},
    sessions: {
      [aMinorSessionId]: createSession({
        id: aMinorSessionId,
        name: "A Minor Looper Session",
        noteCollectionKey: "minor",
        rootNote: "A",
      }),
      [cMajorSessionId]: createSession({
        id: cMajorSessionId,
        name: "C Major Looper Session",
        noteCollectionKey: "major",
        rootNote: "C",
      }),
    },
  };
}

export function createDojoBackupJson(
  snapshot: AppStoreSnapshot,
  exportedAt = "2026-07-26T14:30:22.000Z",
) {
  return JSON.stringify({
    data: snapshot,
    dataVersion: APP_STORE_VERSION,
    exportedAt,
    formatVersion: DOJO_BACKUP_FORMAT_VERSION,
    kind: DOJO_BACKUP_KIND,
  });
}

export async function seedDojoWorkspace(
  page: Page,
  snapshot = createKeyboardWorkspaceSnapshot(),
) {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: APP_STORE_STORAGE_KEY,
      value: JSON.stringify({ state: snapshot, version: APP_STORE_VERSION }),
    },
  );
}

export async function seedDojoWorkspaceOnce(
  page: Page,
  snapshot = createKeyboardWorkspaceSnapshot(),
) {
  await page.goto("/dojo");
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: APP_STORE_STORAGE_KEY,
      value: JSON.stringify({ state: snapshot, version: APP_STORE_VERSION }),
    },
  );
  await page.reload();
}

export async function expectWorkspacePersisted(
  page: Page,
  assertion: (
    snapshot: ReturnType<typeof createKeyboardWorkspaceSnapshot>,
  ) => boolean | Promise<boolean>,
) {
  await expect
    .poll(async () => {
      const persistedValue = await page.evaluate((key) => {
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value).state : null;
      }, APP_STORE_STORAGE_KEY);

      return persistedValue ? assertion(persistedValue) : false;
    })
    .toBe(true);
}

export async function waitForServiceWorkerControl(page: Page) {
  await page.waitForFunction(
    () =>
      "serviceWorker" in navigator &&
      navigator.serviceWorker.controller !== null,
    undefined,
    { timeout: 120_000 },
  );
}
