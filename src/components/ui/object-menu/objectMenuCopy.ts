export type ManagedObjectKind = "session" | "part" | "instrument";

export type ObjectManagementActionKind = "duplicate" | "danger";

interface ObjectManagementCopy {
  dangerGerund: string;
  dangerVerb: "Delete" | "Remove";
  noun: string;
}

interface ObjectManagementCopyOptions {
  objectName?: string;
}

interface ObjectManagementDuplicateCopy {
  ariaLabel: string;
  kind: "duplicate";
  label: "Duplicate";
}

interface ObjectManagementDangerCopy {
  actionAriaLabel: string;
  confirmAriaLabel: string;
  confirmButtonLabel: "Delete" | "Remove";
  confirmLabel: string;
  kind: "danger";
  label: "Delete" | "Remove";
}

const objectManagementCopy = {
  session: {
    dangerGerund: "deleting",
    dangerVerb: "Delete",
    noun: "session",
  },
  part: {
    dangerGerund: "removing",
    dangerVerb: "Remove",
    noun: "part",
  },
  instrument: {
    dangerGerund: "removing",
    dangerVerb: "Remove",
    noun: "instrument",
  },
} as const satisfies Record<ManagedObjectKind, ObjectManagementCopy>;

export function getObjectManagementDangerVerb(kind: ManagedObjectKind) {
  return objectManagementCopy[kind].dangerVerb;
}

export function getObjectManagementActions(
  kind: ManagedObjectKind,
  { objectName }: ObjectManagementCopyOptions = {},
): readonly [ObjectManagementDuplicateCopy, ObjectManagementDangerCopy] {
  const copy = objectManagementCopy[kind];
  const trimmedObjectName = objectName?.trim();
  const confirmTarget = trimmedObjectName || `this ${copy.noun}`;
  const confirmAriaTarget = trimmedObjectName || copy.noun;

  return [
    {
      ariaLabel: `Duplicate ${copy.noun}`,
      kind: "duplicate",
      label: "Duplicate",
    },
    {
      actionAriaLabel: `${copy.dangerVerb} ${copy.noun}`,
      confirmAriaLabel: trimmedObjectName
        ? `Confirm ${copy.dangerGerund} ${confirmAriaTarget}. This cannot be undone.`
        : `Confirm ${copy.dangerVerb.toLowerCase()} ${confirmAriaTarget}`,
      confirmButtonLabel: copy.dangerVerb,
      confirmLabel: `${copy.dangerVerb} ${confirmTarget}?`,
      kind: "danger",
      label: copy.dangerVerb,
    },
  ];
}
