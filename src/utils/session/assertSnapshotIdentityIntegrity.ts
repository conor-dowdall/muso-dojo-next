import { isRecord } from "@/utils/session/normalizationPrimitives";

export class SnapshotIdentityIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotIdentityIntegrityError";
  }
}

function failIdentityIntegrity(message: string): never {
  throw new SnapshotIdentityIntegrityError(message);
}

function requireCanonicalId(value: unknown, label: string) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value
  ) {
    failIdentityIntegrity(
      `${label} must have a non-empty canonical identifier.`,
    );
  }

  return value;
}

function assertCanonicalRecordIds(
  value: unknown,
  entityLabel: "Arrangement" | "Session",
) {
  if (!isRecord(value)) {
    return;
  }

  const usedIds = new Set<string>();
  Object.entries(value).forEach(([recordKey, entity]) => {
    if (!isRecord(entity)) {
      return;
    }

    const id = requireCanonicalId(entity.id, entityLabel);

    if (recordKey !== id) {
      failIdentityIntegrity(
        `${entityLabel} record key "${recordKey}" does not match identifier "${id}".`,
      );
    }

    if (usedIds.has(id)) {
      failIdentityIntegrity(
        `The snapshot contains conflicting ${entityLabel} identifiers.`,
      );
    }

    usedIds.add(id);
  });
}

function assertArrangementSectionReferences(value: unknown) {
  if (!isRecord(value)) {
    return;
  }

  Object.values(value).forEach((arrangement) => {
    if (!isRecord(arrangement) || !Array.isArray(arrangement.sections)) {
      return;
    }

    const sectionIds = new Set<string>();
    arrangement.sections.forEach((section) => {
      if (!isRecord(section)) {
        return;
      }

      const sectionId = requireCanonicalId(section.id, "Arrangement Section");

      if (sectionIds.has(sectionId)) {
        failIdentityIntegrity(
          "The snapshot contains conflicting Arrangement Section identifiers.",
        );
      }

      sectionIds.add(sectionId);
    });

    if (!Array.isArray(arrangement.entries)) {
      return;
    }

    arrangement.entries.forEach((entry) => {
      if (!isRecord(entry)) {
        return;
      }

      const sectionId = requireCanonicalId(
        entry.sectionId,
        "Arrangement Entry Section reference",
      );

      if (!sectionIds.has(sectionId)) {
        failIdentityIntegrity(
          `Arrangement Entry refers to missing Section "${sectionId}".`,
        );
      }
    });
  });
}

/**
 * Rejects identity defects that cannot be repaired without guessing which
 * persisted entity a reference intended to target. Part and Module collisions
 * are deliberately handled by graph normalization because their references are
 * locally scoped and can be remapped without ambiguity.
 */
export function assertSnapshotIdentityIntegrity(value: unknown) {
  if (!isRecord(value)) {
    return;
  }

  assertCanonicalRecordIds(value.sessions, "Session");
  assertCanonicalRecordIds(value.arrangements, "Arrangement");
  assertArrangementSectionReferences(value.arrangements);
}
