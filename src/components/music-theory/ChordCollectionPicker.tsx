"use client";

import {
  groupedNoteCollections,
  noteCollectionGroupsMetadata,
  type ChordCollection,
  type ChordCollectionKey,
  type NoteCollectionGroupKey,
} from "@musodojo/music-theory-data";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import choiceGridStyles from "@/components/ui/choice-grid/ChoiceGrid.module.css";
import { Heading } from "@/components/ui/typography/Heading";
import styles from "./NoteCollectionPicker.module.css";

interface ChordCollectionPickerProps {
  value: ChordCollectionKey;
  onChange: (value: ChordCollectionKey) => void;
}

function getChordTypeName(collection: ChordCollection) {
  return (
    collection.names.find(
      (name) => name.length > 2 && /^[A-Za-z]/.test(name),
    ) ?? collection.primaryName
  );
}

export function ChordCollectionPicker({
  value,
  onChange,
}: ChordCollectionPickerProps) {
  return (
    <div className={styles.groupList}>
      {(Object.keys(groupedNoteCollections) as NoteCollectionGroupKey[]).map(
        (groupKey) => {
          const chordEntries = Object.entries(
            groupedNoteCollections[groupKey],
          ).filter(
            (entry): entry is [ChordCollectionKey, ChordCollection] =>
              entry[1].category === "chord",
          );

          if (chordEntries.length === 0) {
            return null;
          }

          const headingId = `chord-collection-${groupKey}`;

          return (
            <section
              key={groupKey}
              className={styles.collectionSection}
              aria-labelledby={headingId}
            >
              <Heading as="h3" id={headingId} size="xs" variant="muted">
                {noteCollectionGroupsMetadata[groupKey].displayName}
              </Heading>
              <div className={choiceGridStyles.cardGrid}>
                {chordEntries.map(([key, collection]) => (
                  <OptionButton
                    key={key}
                    density="compact"
                    label={getChordTypeName(collection)}
                    presentation="tile"
                    selected={value === key}
                    subtitle={`${collection.symbol.chordSuffix || "M"} · ${collection.intervals.join(" ")}`}
                    onClick={() => onChange(key)}
                  />
                ))}
              </div>
            </section>
          );
        },
      )}
    </div>
  );
}
