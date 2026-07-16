"use client";

import {
  chordProgression,
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

interface ChordQualityPickerProps {
  value: ChordCollectionKey;
  onChange: (value: ChordCollectionKey) => void;
}

const descriptiveChordNamePattern =
  /^(Major|Minor|Dominant|Diminished|Half Diminished|Augmented)/;

export function getChordQualityDisplayName(collection: ChordCollection) {
  return (
    collection.names.find((name) => descriptiveChordNamePattern.test(name)) ??
    collection.primaryName
  );
}

function getChordQualityRomanExample(chordCollectionKey: ChordCollectionKey) {
  return chordProgression.getDirectRomanSymbols({
    chords: [{ chordCollectionKey, degree: "1", durationInBars: 1 }],
  })[0];
}

function getGroupDisplayName(groupKey: NoteCollectionGroupKey) {
  return noteCollectionGroupsMetadata[groupKey].displayName.replace(
    / Variants$/,
    "",
  );
}

export function ChordQualityPicker({
  value,
  onChange,
}: ChordQualityPickerProps) {
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

          const headingId = `chord-quality-${groupKey}`;

          return (
            <section
              key={groupKey}
              className={styles.collectionSection}
              aria-labelledby={headingId}
            >
              <Heading as="h3" id={headingId} size="xs" variant="muted">
                {getGroupDisplayName(groupKey)}
              </Heading>
              <div className={choiceGridStyles.cardGrid}>
                {chordEntries.map(([key, collection]) => (
                  <OptionButton
                    key={key}
                    density="compact"
                    label={getChordQualityDisplayName(collection)}
                    presentation="tile"
                    selected={value === key}
                    subtitle={`${getChordQualityRomanExample(key)} · ${collection.intervals.join(" ")}`}
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
