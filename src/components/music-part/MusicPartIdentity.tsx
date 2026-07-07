"use client";

import { rootAndNoteCollection } from "@musodojo/music-theory-data";
import { type ComponentPropsWithoutRef } from "react";
import { useMusicPart } from "./MusicPartContext";
import styles from "./MusicPartIdentity.module.css";

interface MusicPartIdentityProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  partNumber?: number;
  prominence?: "section" | "compact";
}

function joinClasses(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function MusicPartIdentity({
  className,
  partNumber,
  prominence = "section",
  ...props
}: MusicPartIdentityProps) {
  const { noteCollectionKey, rootNote } = useMusicPart();
  const identity = rootAndNoteCollection.getIdentity({
    noteCollectionKey,
    rootNote,
  });
  const partLabel = partNumber === undefined ? undefined : `Part ${partNumber}`;
  const accessibleLabel = partLabel
    ? `${partLabel}. ${identity.accessibleLabel}.`
    : identity.accessibleLabel;

  return (
    <div
      {...props}
      aria-label={accessibleLabel}
      className={joinClasses(styles.identity, className)}
      data-prominence={prominence}
      title={identity.label}
    >
      {partLabel ? (
        <span aria-hidden="true" className={styles.partLabel}>
          {partLabel}
        </span>
      ) : null}
      <span aria-hidden="true" className={styles.label}>
        {identity.label}
      </span>
    </div>
  );
}
