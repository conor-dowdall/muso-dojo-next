export type ObjectMenuLevel = "session" | "part" | "instrument";

export type ObjectManagementActionKind = "duplicate" | "danger";

interface ObjectMenuCopy {
  dangerGerund: string;
  dangerVerb: "Delete" | "Remove";
  noun: string;
  title: string;
  triggerLabel: string;
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

const objectMenuCopy = {
  session: {
    dangerGerund: "deleting",
    dangerVerb: "Delete",
    noun: "session",
    title: "Session Menu",
    triggerLabel: "Session menu",
  },
  part: {
    dangerGerund: "removing",
    dangerVerb: "Remove",
    noun: "part",
    title: "Part Menu",
    triggerLabel: "Part menu",
  },
  instrument: {
    dangerGerund: "removing",
    dangerVerb: "Remove",
    noun: "instrument",
    title: "Instrument Menu",
    triggerLabel: "Instrument menu",
  },
} as const satisfies Record<ObjectMenuLevel, ObjectMenuCopy>;

export function getObjectMenuTitle(level: ObjectMenuLevel) {
  return objectMenuCopy[level].title;
}

export function getObjectMenuTriggerLabel(level: ObjectMenuLevel) {
  return objectMenuCopy[level].triggerLabel;
}

export function getObjectMenuDangerVerb(level: ObjectMenuLevel) {
  return objectMenuCopy[level].dangerVerb;
}

export function getObjectManagementActions(
  level: ObjectMenuLevel,
  { objectName }: ObjectManagementCopyOptions = {},
): readonly [ObjectManagementDuplicateCopy, ObjectManagementDangerCopy] {
  const copy = objectMenuCopy[level];
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
