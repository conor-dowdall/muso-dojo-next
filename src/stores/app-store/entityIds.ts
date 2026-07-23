import { DEFAULT_SESSION_NAME } from "@/utils/session/sessionDefaults";

export const DEFAULT_ARRANGEMENT_NAME = "My Arrangement";

export function createCopyId(baseId: string, existingIds: Iterable<string>) {
  const existingIdSet = new Set(existingIds);
  const copyBase = baseId.replace(/-copy(?:-\d+)?$/, "");
  let copyIndex = 1;
  let nextId = `${copyBase}-copy`;

  while (existingIdSet.has(nextId)) {
    copyIndex += 1;
    nextId = `${copyBase}-copy-${copyIndex}`;
  }

  return nextId;
}

export function normalizeEntityNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

export const normalizeSessionNameForComparison =
  normalizeEntityNameForComparison;

export function createUniqueEntityName(
  preferredName: string | undefined,
  existingNames: Iterable<string>,
  defaultName = DEFAULT_SESSION_NAME,
) {
  const baseName = preferredName?.trim() || defaultName;
  const existingNameSet = new Set(
    Array.from(existingNames, normalizeEntityNameForComparison),
  );
  const baseNameKey = normalizeEntityNameForComparison(baseName);

  if (!existingNameSet.has(baseNameKey)) {
    return baseName;
  }

  let nameIndex = 2;
  let nextName = `${baseName} ${nameIndex}`;

  while (existingNameSet.has(normalizeEntityNameForComparison(nextName))) {
    nameIndex += 1;
    nextName = `${baseName} ${nameIndex}`;
  }

  return nextName;
}

export function createUniqueSessionName(
  preferredName: string | undefined,
  existingNames: Iterable<string>,
) {
  return createUniqueEntityName(
    preferredName,
    existingNames,
    DEFAULT_SESSION_NAME,
  );
}

export function createUniqueArrangementName(
  preferredName: string | undefined,
  existingNames: Iterable<string>,
) {
  return createUniqueEntityName(
    preferredName,
    existingNames,
    DEFAULT_ARRANGEMENT_NAME,
  );
}

export function createSessionCopyName(sessionName: string) {
  const sourceName = sessionName.replace(/\s+Copy(?:\s+\d+)?$/i, "");
  return `${sourceName} Copy`;
}

export function createEntityCopyName(name: string) {
  const sourceName = name.replace(/\s+Copy(?:\s+\d+)?$/i, "");
  return `${sourceName} Copy`;
}
