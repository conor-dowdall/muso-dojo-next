import { expect, type Page } from "@playwright/test";
import { type AppStoreSnapshot } from "../../src/types/session";

const APP_STORE_STORAGE_KEY = "muso-dojo-app-store";
const APP_STORE_VERSION = 12;

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
    sessionWorkspaceViewMode: "session",
    sessions: {
      [sessionId]: {
        backingBand,
        id: sessionId,
        lastModified: "2026-01-01T00:00:00.000Z",
        name: "Browser Session",
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
