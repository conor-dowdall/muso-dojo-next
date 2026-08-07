import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_STORE_VERSION } from "@/stores/app-store/persistence";
import {
  createStoreSnapshot,
  createTestStore,
  sessionId,
} from "@/stores/app-store/__tests__/appStoreTestUtils";
import {
  DOJO_BACKUP_CONTENT_TYPE,
  DOJO_BACKUP_FORMAT_VERSION,
  DOJO_BACKUP_KIND,
  MAX_DOJO_BACKUP_FILE_BYTES,
  DojoBackupError,
  createDojoBackupDocument,
  createDojoBackupFile,
  downloadDojoBackupFile,
  parseDojoBackup,
  readDojoBackupFile,
  serializeDojoBackup,
} from "@/utils/dojo-backup/dojoBackup";
import { normalizeAppStoreSnapshot } from "@/utils/session/normalizeAppStoreSnapshot";

const exportedAt = new Date("2026-07-26T14:30:22.000Z");

function createCompleteSnapshot() {
  const store = createTestStore();

  store.getState().setAppTheme("ocean");
  store.getState().addCustomFretboardTuning({
    instrument: "guitar",
    name: "Open D",
    openMidiNotes: [38, 45, 50, 54, 57, 62],
  });
  store.getState().addCustomChordProgression({
    name: "My Changes",
    progression: {
      chords: [
        {
          degree: "1",
          chordCollectionKey: "major",
          durationInBars: 1,
        },
      ],
    },
  });

  const arrangementId = store.getState().addArrangement({ name: "Whole Song" });
  store.getState().addArrangementSectionFromSession(arrangementId, sessionId);
  store.getState().setArrangementPlaybackMode(arrangementId, "loop");

  return store.getState();
}

function expectSyncBackupError(
  callback: () => unknown,
  code: DojoBackupError["code"],
) {
  let caughtError: unknown;

  try {
    callback();
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(DojoBackupError);
  expect(caughtError).toMatchObject({ code });
}

async function expectAsyncBackupError(
  callback: () => Promise<unknown>,
  code: DojoBackupError["code"],
) {
  let caughtError: unknown;

  try {
    await callback();
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(DojoBackupError);
  expect(caughtError).toMatchObject({ code });
}

function editSerializedBackup(
  snapshot: ReturnType<typeof createCompleteSnapshot>,
  edit: (document: Record<string, unknown>) => void,
) {
  const document = JSON.parse(
    serializeDojoBackup(snapshot, { exportedAt }),
  ) as Record<string, unknown>;
  edit(document);

  return JSON.stringify(document);
}

describe("Dojo JSON backups", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("round-trips every persisted Dojo domain through a versioned document", () => {
    const source = createCompleteSnapshot();
    const document = createDojoBackupDocument(source, { exportedAt });
    const parsed = parseDojoBackup(JSON.stringify(document));

    expect(document).toMatchObject({
      kind: DOJO_BACKUP_KIND,
      formatVersion: DOJO_BACKUP_FORMAT_VERSION,
      dataVersion: APP_STORE_VERSION,
      exportedAt: exportedAt.toISOString(),
    });
    expect(document.data.sessions).toHaveProperty(sessionId);
    expect(Object.values(document.data.arrangements)).toHaveLength(1);
    expect(document.data.dojoSettings).toMatchObject({
      appTheme: "ocean",
      customChordProgressions: [{ name: "My Changes" }],
      customFretboardTunings: [{ name: "Open D" }],
    });
    expect(document.data).not.toHaveProperty("restoreDojoSnapshot");
    expect(parsed.snapshot).toEqual(
      normalizeAppStoreSnapshot(document.data, document.data),
    );
  });

  it("uses a readable JSON file name and reads the generated Blob", async () => {
    const source = createCompleteSnapshot();
    const backupFile = createDojoBackupFile(source, { exportedAt });
    const parsed = await readDojoBackupFile(backupFile.blob);

    expect(backupFile.fileName).toBe(
      "muso-dojo-backup-2026-07-26-143022Z.json",
    );
    expect(backupFile.exportedAt).toBe(exportedAt.toISOString());
    expect(backupFile.blob.type).toBe(DOJO_BACKUP_CONTENT_TYPE);
    expect(parsed.exportedAt).toBe(exportedAt.toISOString());
    expect(
      parsed.snapshot.dojoSettings.customChordProgressions?.[0]?.name,
    ).toBe("My Changes");
  });

  it("continues reading backups with the legacy set filename", async () => {
    const legacyBackup = new File(
      [serializeDojoBackup(createCompleteSnapshot(), { exportedAt })],
      "muso-dojo-set-2026-07-26-143022Z.json",
      { type: DOJO_BACKUP_CONTENT_TYPE },
    );

    const parsed = await readDojoBackupFile(legacyBackup);

    expect(parsed.exportedAt).toBe(exportedAt.toISOString());
    expect(parsed.snapshot.sessions).toHaveProperty(sessionId);
  });

  it("rejects malformed JSON and documents that are not complete backups", () => {
    const source = createCompleteSnapshot();

    expectSyncBackupError(() => parseDojoBackup("{not-json"), "invalid-json");
    expectSyncBackupError(
      () => parseDojoBackup(JSON.stringify({ kind: "something-else" })),
      "invalid-backup",
    );
    expectSyncBackupError(
      () =>
        parseDojoBackup(
          editSerializedBackup(source, (document) => {
            document.exportedAt = "July 26, 2026";
          }),
        ),
      "invalid-backup",
    );
    expectSyncBackupError(
      () =>
        parseDojoBackup(
          editSerializedBackup(source, (document) => {
            document.data = { sessions: {} };
          }),
        ),
      "invalid-backup",
    );
    expectSyncBackupError(
      () =>
        parseDojoBackup(
          editSerializedBackup(source, (document) => {
            const data = document.data as Record<string, unknown>;
            const arrangements = data.arrangements as Record<
              string,
              Record<string, unknown>
            >;
            const arrangement = Object.values(arrangements)[0];
            const sections = arrangement?.sections as
              Record<string, unknown>[] | undefined;

            if (sections?.[0]) {
              sections[0].parts = [{ id: "part", modules: "not-an-array" }];
            }
          }),
        ),
      "invalid-backup",
    );
    expectSyncBackupError(
      () =>
        parseDojoBackup(
          editSerializedBackup(source, (document) => {
            const data = document.data as Record<string, unknown>;
            data.sessions = { broken: { parts: "not-an-array" } };
          }),
        ),
      "invalid-backup",
    );
  });

  it("rejects unknown formats and data from newer app versions", () => {
    const source = createCompleteSnapshot();

    expectSyncBackupError(
      () =>
        parseDojoBackup(
          editSerializedBackup(source, (document) => {
            document.formatVersion = DOJO_BACKUP_FORMAT_VERSION + 1;
          }),
        ),
      "unsupported-format-version",
    );
    expectSyncBackupError(
      () =>
        parseDojoBackup(
          editSerializedBackup(source, (document) => {
            document.dataVersion = APP_STORE_VERSION + 1;
          }),
        ),
      "newer-data-version",
    );
  });

  it("normalizes recoverable data from an older app version", () => {
    const source = createCompleteSnapshot();
    const parsed = parseDojoBackup(
      editSerializedBackup(source, (document) => {
        document.dataVersion = APP_STORE_VERSION - 1;
        const data = document.data as Record<string, unknown>;
        data.activeSessionId = "missing";
        data.activeWorkspace = { kind: "session", id: "missing" };
        const sessions = data.sessions as Record<
          string,
          Record<string, unknown>
        >;
        const parts = sessions[sessionId]?.parts as Record<string, unknown>[];

        if (parts[0]) {
          parts[0].rootNote = "not-a-note";
        }
      }),
    );

    expect(parsed.dataVersion).toBe(APP_STORE_VERSION - 1);
    expect(parsed.snapshot.sessions[sessionId]?.parts[0]?.rootNote).toBe("C");
    expect(parsed.snapshot.activeWorkspace?.kind).toBe("session");
    expect(parsed.snapshot.activeWorkspace?.id).toBe(sessionId);
    expect(parsed.snapshot.activeSessionId).toBe(sessionId);
  });

  it("reports oversized and unreadable files without attempting an import", async () => {
    const oversizedFile = {
      size: MAX_DOJO_BACKUP_FILE_BYTES + 1,
      text: vi.fn(),
    } as unknown as Blob;
    const unreadableFile = {
      size: 1,
      text: vi.fn().mockRejectedValue(new Error("Read failed")),
    } as unknown as Blob;

    await expectAsyncBackupError(
      () => readDojoBackupFile(oversizedFile),
      "file-too-large",
    );
    expect(oversizedFile.text).not.toHaveBeenCalled();

    await expectAsyncBackupError(
      () => readDojoBackupFile(unreadableFile),
      "file-read-failed",
    );
  });

  it("downloads through a temporary object URL and then releases it", () => {
    vi.useFakeTimers();
    const click = vi.fn();
    const remove = vi.fn();
    const append = vi.fn();
    const createObjectURL = vi.fn(() => "blob:dojo-backup");
    const revokeObjectURL = vi.fn();
    const link = {
      click,
      download: "",
      hidden: false,
      href: "",
      rel: "",
      remove,
    };

    vi.stubGlobal("document", {
      body: { append },
      createElement: vi.fn(() => link),
    });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const backupFile = downloadDojoBackupFile(createCompleteSnapshot(), {
      exportedAt,
    });

    expect(createObjectURL).toHaveBeenCalledWith(backupFile.blob);
    expect(append).toHaveBeenCalledWith(link);
    expect(link).toMatchObject({
      download: backupFile.fileName,
      hidden: true,
      href: "blob:dojo-backup",
      rel: "noopener",
    });
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:dojo-backup");
  });

  it("reports when a browser download is unavailable", () => {
    expectSyncBackupError(
      () => downloadDojoBackupFile(createCompleteSnapshot(), { exportedAt }),
      "download-unavailable",
    );
  });

  it("normalizes object URL creation failures as download errors", () => {
    vi.stubGlobal("document", {
      body: { append: vi.fn() },
      createElement: vi.fn(),
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => {
        throw new Error("Object URLs are blocked");
      }),
      revokeObjectURL: vi.fn(),
    });

    expectSyncBackupError(
      () => downloadDojoBackupFile(createCompleteSnapshot(), { exportedAt }),
      "download-unavailable",
    );
  });

  it("releases an object URL when browser download setup fails", () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("document", {
      body: { append: vi.fn() },
      createElement: vi.fn(() => {
        throw new Error("Anchor creation is blocked");
      }),
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:dojo-backup"),
      revokeObjectURL,
    });

    expectSyncBackupError(
      () => downloadDojoBackupFile(createCompleteSnapshot(), { exportedAt }),
      "download-unavailable",
    );
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:dojo-backup");
  });

  it("restores a complete snapshot atomically while retaining store actions", () => {
    const source = createCompleteSnapshot();
    const parsed = parseDojoBackup(serializeDojoBackup(source, { exportedAt }));
    const target = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: { appTheme: "purple" },
    });
    const originalRestoreAction = target.getState().restoreDojoSnapshot;

    target.getState().restoreDojoSnapshot(parsed.snapshot);

    const restored = target.getState();
    expect(restored.restoreDojoSnapshot).toBe(originalRestoreAction);
    expect(restored.sessions).toEqual(parsed.snapshot.sessions);
    expect(restored.arrangements).toEqual(parsed.snapshot.arrangements);
    expect(restored.dojoSettings).toEqual(parsed.snapshot.dojoSettings);
    expect(restored.activeWorkspace).toEqual(parsed.snapshot.activeWorkspace);
    expect(restored.activeSessionId).toBe(parsed.snapshot.activeSessionId);
    expect(restored.sessionWorkspaceViewMode).toBe(
      parsed.snapshot.sessionWorkspaceViewMode,
    );
  });
});
