"use client";

import {
  groupedNoteCollections,
  noteCollection,
  noteCollectionGroupKeys,
  noteCollectionGroupsMetadata,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import styles from "./NoteCollectionPicker.module.css";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import choiceGridStyles from "@/components/ui/choice-grid/ChoiceGrid.module.css";
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
      {noteCollectionGroupKeys.map((groupKey) => {
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
            <div className={choiceGridStyles.cardGrid}>
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
      })}
    </div>
  );
}
