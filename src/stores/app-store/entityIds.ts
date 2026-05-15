import { DEFAULT_SESSION_NAME } from "@/utils/session/sessionDefaults";

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

export function normalizeSessionNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function createUniqueSessionName(
  preferredName: string | undefined,
  existingNames: Iterable<string>,
) {
  const baseName = preferredName?.trim() || DEFAULT_SESSION_NAME;
  const existingNameSet = new Set(
    Array.from(existingNames, normalizeSessionNameForComparison),
  );
  const baseNameKey = normalizeSessionNameForComparison(baseName);

  if (!existingNameSet.has(baseNameKey)) {
    return baseName;
  }

  let nameIndex = 2;
  let nextName = `${baseName} ${nameIndex}`;

  while (existingNameSet.has(normalizeSessionNameForComparison(nextName))) {
    nameIndex += 1;
    nextName = `${baseName} ${nameIndex}`;
  }

  return nextName;
}

export function createSessionCopyName(sessionName: string) {
  const sourceName = sessionName.replace(/\s+Copy(?:\s+\d+)?$/i, "");
  return `${sourceName} Copy`;
}
