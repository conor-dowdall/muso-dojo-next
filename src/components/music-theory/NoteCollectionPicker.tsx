"use client";

import {
  groupedNoteCollections,
  noteCollection,
  noteCollectionGroupsMetadata,
  type NoteCollectionKey,
  type NoteCollectionGroupKey,
} from "@musodojo/music-theory-data";
import styles from "./NoteCollectionPicker.module.css";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Heading } from "@/components/ui/typography/Heading";

interface NoteCollectionPickerProps {
  value?: NoteCollectionKey;
  onChange: (noteCollectionKey: NoteCollectionKey) => void;
}

export function NoteCollectionPicker({
  value,
  onChange,
}: NoteCollectionPickerProps) {
  return (
    <div className={styles.groupList}>
      {(Object.keys(groupedNoteCollections) as NoteCollectionGroupKey[]).map(
        (groupKey) => {
          const groupMetadata = noteCollectionGroupsMetadata[groupKey];
          const groupCollections = groupedNoteCollections[groupKey];

          if (!groupCollections) return null;

          const headingId = `note-collection-${groupKey}`;

          return (
            <section
              key={groupKey}
              className={styles.collectionSection}
              aria-labelledby={headingId}
            >
              <Heading as="h3" id={headingId} size="xs" variant="muted">
                {groupMetadata.displayName}
              </Heading>
              <div className={styles.buttonGrid}>
                {Object.keys(groupCollections).map((key) => {
                  const collectionKey = key as NoteCollectionKey;

                  return (
                    <OptionButton
                      key={collectionKey}
                      density="compact"
                      label={noteCollection.getDisplayName(collectionKey)}
                      presentation="tile"
                      selected={value === collectionKey}
                      subtitle={noteCollection
                        .getIntervals(collectionKey)
                        .join(" ")}
                      onClick={() => onChange(collectionKey)}
                    />
                  );
                })}
              </div>
            </section>
          );
        },
      )}
    </div>
  );
}
