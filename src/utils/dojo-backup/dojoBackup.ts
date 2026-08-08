import {
  APP_STORE_VERSION,
  partializeAppStoreSnapshot,
} from "@/stores/app-store/persistence";
import { type AppStoreSnapshot } from "@/types/session";
import { isSessionWorkspaceViewMode } from "@/types/session-view";
import { normalizeAppStoreSnapshot } from "@/utils/session/normalizeAppStoreSnapshot";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export const DOJO_BACKUP_KIND = "muso-dojo-backup";
export const DOJO_BACKUP_FORMAT_VERSION = 1;
export const DOJO_BACKUP_CONTENT_TYPE = "application/json;charset=utf-8";
export const MAX_DOJO_BACKUP_FILE_BYTES = 10 * 1024 * 1024;

export type DojoBackupErrorCode =
  | "download-unavailable"
  | "file-read-failed"
  | "file-too-large"
  | "invalid-backup"
  | "invalid-json"
  | "newer-data-version"
  | "unsupported-format-version";

export class DojoBackupError extends Error {
  readonly code: DojoBackupErrorCode;

  constructor(
    code: DojoBackupErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DojoBackupError";
    this.code = code;
  }
}

export interface DojoBackupDocument {
  kind: typeof DOJO_BACKUP_KIND;
  formatVersion: typeof DOJO_BACKUP_FORMAT_VERSION;
  dataVersion: number;
  exportedAt: string;
  data: AppStoreSnapshot;
}

export interface ParsedDojoBackup {
  formatVersion: typeof DOJO_BACKUP_FORMAT_VERSION;
  dataVersion: number;
  exportedAt: string;
  snapshot: AppStoreSnapshot;
}

export interface DojoBackupFile {
  blob: Blob;
  exportedAt: string;
  fileName: string;
}

export interface CreateDojoBackupOptions {
  exportedAt?: Date;
}

const emptyDojoSnapshot: AppStoreSnapshot = {
  activeWorkspace: null,
  arrangements: {},
  activeSessionId: null,
  dojoSettings: {},
  sessionWorkspaceViewMode: "session",
  sessions: {},
};

function invalidBackup(message: string): never {
  throw new DojoBackupError("invalid-backup", message);
}

function hasOwn(value: Record<string, unknown>, property: string) {
  return Object.prototype.hasOwnProperty.call(value, property);
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}

function hasMusicPartArrayStructure(value: unknown) {
  return (
    isRecordArray(value) &&
    value.every(
      (part) => isRecordArray(part.modules) && typeof part.id === "string",
    )
  );
}

function hasSessionStructure(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.lastModified === "string" &&
    hasMusicPartArrayStructure(value.parts)
  );
}

function hasArrangementStructure(value: unknown) {
  if (
    !isRecord(value) ||
    !isRecordArray(value.sections) ||
    !isRecordArray(value.entries)
  ) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.lastModified === "string" &&
    value.sections.every(
      (section) =>
        typeof section.id === "string" &&
        hasMusicPartArrayStructure(section.parts) &&
        isRecord(section.source),
    ) &&
    value.entries.every(
      (entry) =>
        typeof entry.id === "string" && typeof entry.sectionId === "string",
    )
  );
}

function hasActiveWorkspaceStructure(value: unknown) {
  return (
    value === null ||
    (isRecord(value) &&
      (value.kind === "session" || value.kind === "arrangement") &&
      typeof value.id === "string")
  );
}

function normalizedIdentifier(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasDuplicateIdentifiers(values: readonly Record<string, unknown>[]) {
  const ids = values.map((value) => normalizedIdentifier(value.id));
  return new Set(ids).size !== ids.length;
}

function assertSnapshotGraphIntegrity(value: Record<string, unknown>) {
  const sessionRecord = value.sessions as Record<
    string,
    Record<string, unknown>
  >;
  const arrangementRecord = value.arrangements as Record<
    string,
    Record<string, unknown>
  >;
  const sessions = Object.values(sessionRecord);
  const arrangements = Object.values(arrangementRecord);

  if (hasDuplicateIdentifiers(sessions)) {
    invalidBackup("The backup contains conflicting Session identifiers.");
  }

  if (hasDuplicateIdentifiers(arrangements)) {
    invalidBackup("The backup contains conflicting Arrangement identifiers.");
  }

  arrangements.forEach((arrangement) => {
    const sections = arrangement.sections as Record<string, unknown>[];

    if (hasDuplicateIdentifiers(sections)) {
      invalidBackup(
        "The backup contains conflicting Arrangement Section identifiers.",
      );
    }

    const sectionIds = new Set(
      sections.map((section) => normalizedIdentifier(section.id)),
    );
    const entries = arrangement.entries as Record<string, unknown>[];

    if (
      entries.some(
        (entry) => !sectionIds.has(normalizedIdentifier(entry.sectionId)),
      )
    ) {
      invalidBackup(
        "The backup contains an Arrangement Entry with no matching Section.",
      );
    }
  });
}

function assertSnapshotStructure(value: unknown) {
  if (!isRecord(value)) {
    invalidBackup("The backup does not contain Dojo data.");
  }

  const requiredProperties = [
    "activeWorkspace",
    "arrangements",
    "activeSessionId",
    "dojoSettings",
    "sessionWorkspaceViewMode",
    "sessions",
  ];

  if (requiredProperties.some((property) => !hasOwn(value, property))) {
    invalidBackup("The backup is missing required Dojo data.");
  }

  if (
    !isRecord(value.sessions) ||
    !Object.values(value.sessions).every(hasSessionStructure)
  ) {
    invalidBackup("The backup contains invalid Session data.");
  }

  if (
    !isRecord(value.arrangements) ||
    !Object.values(value.arrangements).every(hasArrangementStructure)
  ) {
    invalidBackup("The backup contains invalid Arrangement data.");
  }

  if (!isRecord(value.dojoSettings)) {
    invalidBackup("The backup contains invalid Dojo settings.");
  }

  if (
    value.activeSessionId !== null &&
    typeof value.activeSessionId !== "string"
  ) {
    invalidBackup("The backup contains an invalid active Session.");
  }

  if (!hasActiveWorkspaceStructure(value.activeWorkspace)) {
    invalidBackup("The backup contains an invalid active workspace.");
  }

  if (!isSessionWorkspaceViewMode(value.sessionWorkspaceViewMode)) {
    invalidBackup("The backup contains an invalid workspace view.");
  }

  assertSnapshotGraphIntegrity(value);
}

function resolveExportedAt(exportedAt = new Date()) {
  if (Number.isNaN(exportedAt.getTime())) {
    throw new DojoBackupError(
      "invalid-backup",
      "A valid export date is required to create a backup.",
    );
  }

  return exportedAt.toISOString();
}

function stringifyDojoBackupDocument(document: DojoBackupDocument) {
  try {
    return `${JSON.stringify(document, null, 2)}\n`;
  } catch (error) {
    throw new DojoBackupError(
      "invalid-backup",
      "The Dojo data could not be converted to JSON.",
      { cause: error },
    );
  }
}

function formatBackupFileName(exportedAt: string) {
  const timestamp = exportedAt
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll(":", "")
    .replace("T", "-");

  return `muso-dojo-backup-${timestamp}.json`;
}

export function createDojoBackupDocument(
  snapshot: AppStoreSnapshot,
  { exportedAt }: CreateDojoBackupOptions = {},
): DojoBackupDocument {
  return {
    kind: DOJO_BACKUP_KIND,
    formatVersion: DOJO_BACKUP_FORMAT_VERSION,
    dataVersion: APP_STORE_VERSION,
    exportedAt: resolveExportedAt(exportedAt),
    data: partializeAppStoreSnapshot(snapshot),
  };
}

export function serializeDojoBackup(
  snapshot: AppStoreSnapshot,
  options?: CreateDojoBackupOptions,
) {
  return stringifyDojoBackupDocument(
    createDojoBackupDocument(snapshot, options),
  );
}

export function parseDojoBackup(json: string): ParsedDojoBackup {
  let value: unknown;

  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new DojoBackupError(
      "invalid-json",
      "The selected file is not valid JSON.",
      { cause: error },
    );
  }

  if (!isRecord(value) || value.kind !== DOJO_BACKUP_KIND) {
    invalidBackup("This is not a Muso Dojo backup.");
  }

  if (
    typeof value.formatVersion !== "number" ||
    !Number.isInteger(value.formatVersion) ||
    value.formatVersion !== DOJO_BACKUP_FORMAT_VERSION
  ) {
    throw new DojoBackupError(
      "unsupported-format-version",
      "This backup format is not supported by this version of Muso Dojo.",
    );
  }

  if (
    typeof value.dataVersion !== "number" ||
    !Number.isInteger(value.dataVersion) ||
    value.dataVersion < 0
  ) {
    invalidBackup("The backup contains an invalid data version.");
  }

  const dataVersion = value.dataVersion;

  if (dataVersion > APP_STORE_VERSION) {
    throw new DojoBackupError(
      "newer-data-version",
      "This backup was created by a newer version of Muso Dojo.",
    );
  }

  if (!isValidDateString(value.exportedAt)) {
    invalidBackup("The backup contains an invalid export date.");
  }

  assertSnapshotStructure(value.data);

  return {
    formatVersion: DOJO_BACKUP_FORMAT_VERSION,
    dataVersion,
    exportedAt: value.exportedAt,
    snapshot: normalizeAppStoreSnapshot(value.data, emptyDojoSnapshot),
  };
}

export function createDojoBackupFile(
  snapshot: AppStoreSnapshot,
  options?: CreateDojoBackupOptions,
): DojoBackupFile {
  const document = createDojoBackupDocument(snapshot, options);
  const blob = new Blob([stringifyDojoBackupDocument(document)], {
    type: DOJO_BACKUP_CONTENT_TYPE,
  });

  if (blob.size > MAX_DOJO_BACKUP_FILE_BYTES) {
    throw new DojoBackupError(
      "file-too-large",
      "The Dojo backup is too large to save safely.",
    );
  }

  return {
    blob,
    exportedAt: document.exportedAt,
    fileName: formatBackupFileName(document.exportedAt),
  };
}

export async function readDojoBackupFile(
  file: Blob,
): Promise<ParsedDojoBackup> {
  if (file.size > MAX_DOJO_BACKUP_FILE_BYTES) {
    throw new DojoBackupError(
      "file-too-large",
      "The selected backup is too large to load safely.",
    );
  }

  let json: string;

  try {
    json = await file.text();
  } catch (error) {
    throw new DojoBackupError(
      "file-read-failed",
      "The selected backup could not be read.",
      { cause: error },
    );
  }

  return parseDojoBackup(json);
}

export function downloadDojoBackupFile(
  snapshot: AppStoreSnapshot,
  options?: CreateDojoBackupOptions,
): DojoBackupFile {
  if (
    typeof document === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function" ||
    typeof URL.revokeObjectURL !== "function" ||
    !document.body
  ) {
    throw new DojoBackupError(
      "download-unavailable",
      "File downloads are not available in this environment.",
    );
  }

  const backupFile = createDojoBackupFile(snapshot, options);
  const objectUrlApi = URL;
  let link: HTMLAnchorElement | undefined;
  let objectUrl: string | undefined;

  try {
    objectUrl = objectUrlApi.createObjectURL(backupFile.blob);
    link = document.createElement("a");
    link.href = objectUrl;
    link.download = backupFile.fileName;
    link.rel = "noopener";
    link.hidden = true;
    document.body.append(link);
    link.click();
  } catch (error) {
    throw new DojoBackupError(
      "download-unavailable",
      "The Dojo backup could not be downloaded.",
      { cause: error },
    );
  } finally {
    link?.remove();

    if (objectUrl !== undefined) {
      const objectUrlToRevoke = objectUrl;
      setTimeout(() => objectUrlApi.revokeObjectURL(objectUrlToRevoke), 0);
    }
  }

  return backupFile;
}
