import { useRef, useEffect } from "react";
import {
  enharmonicRootNoteGroups,
  groupedNoteCollections,
  noteCollectionGroupsMetadata,
  type NoteCollectionKey,
  type NoteCollectionGroupKey,
} from "@musodojo/music-theory-data";
import styles from "./MusicSelectorDialog.module.css";
import { X } from "lucide-react";

interface MusicSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  onRootNoteChange: (note: string) => void;
  onNoteCollectionChange: (key: NoteCollectionKey) => void;
}

export function MusicSelectorDialog({
  isOpen,
  onClose,
  rootNote,
  noteCollectionKey,
  onRootNoteChange,
  onNoteCollectionChange,
}: MusicSelectorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync dialog open/close with isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Music Settings</h2>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.content}>
        {/* Root Note Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Root Note</h3>
          <div className={styles.rootNoteList}>
            {enharmonicRootNoteGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={styles.rootNoteGroup}>
                {group.map((note) => (
                  <button
                    key={note}
                    type="button"
                    className={styles.noteButton}
                    aria-pressed={rootNote === note}
                    onClick={() => onRootNoteChange(note)}
                  >
                    {note}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Note Collection Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Scale Strategy</h3>
          <div className={styles.collectionList}>
            {(
              Object.keys(groupedNoteCollections) as NoteCollectionGroupKey[]
            ).map((groupKey) => {
              const groupMetadata = noteCollectionGroupsMetadata[groupKey];
              const groupCollections = groupedNoteCollections[groupKey];

              if (!groupCollections) return null;

              return (
                <div key={groupKey} className={styles.collectionGroup}>
                  <span className={styles.collectionGroupTitle}>
                    {groupMetadata.displayName}
                  </span>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                  >
                    {Object.entries(groupCollections).map(
                      ([key, collection]) => (
                        <button
                          key={key}
                          type="button"
                          className={styles.collectionButton}
                          aria-pressed={noteCollectionKey === key}
                          onClick={() =>
                            onNoteCollectionChange(key as NoteCollectionKey)
                          }
                        >
                          {collection.primaryName}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </dialog>
  );
}
