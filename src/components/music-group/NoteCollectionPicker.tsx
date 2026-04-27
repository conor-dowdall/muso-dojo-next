import {
  groupedNoteCollections,
  noteCollectionGroupsMetadata,
  type NoteCollectionKey,
  type NoteCollectionGroupKey,
} from "@musodojo/music-theory-data";
import styles from "./NoteCollectionPicker.module.css";
import { useMusicGroup } from "./MusicGroupContext";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Heading } from "@/components/ui/typography/Heading";

interface NoteCollectionPickerProps {
  onSelect: () => void;
}

export function NoteCollectionPicker({ onSelect }: NoteCollectionPickerProps) {
  const {
    noteCollectionKey: currentCollectionKey,
    setNoteCollectionKey: onCollectionChange,
  } = useMusicGroup();
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
                {Object.entries(groupCollections).map(([key, collection]) => (
                  <OptionButton
                    key={key}
                    density="compact"
                    label={collection.primaryName}
                    presentation="tile"
                    selected={currentCollectionKey === key}
                    onClick={() => {
                      onCollectionChange(key as NoteCollectionKey);
                      onSelect();
                    }}
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
