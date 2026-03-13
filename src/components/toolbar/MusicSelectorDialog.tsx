import { useRef, useEffect } from "react";
import {
  enharmonicRootNoteGroups,
  groupedNoteCollections,
  noteCollectionGroupsMetadata,
  conversions,
  type NoteCollectionKey,
  type NoteCollectionGroupKey,
} from "@musodojo/music-theory-data";
import styles from "./MusicSelectorDialog.module.css";
import { X } from "lucide-react";

export type MusicSelectorMode = "root" | "collection" | "format";

interface MusicSelectorDialogProps {
  isOpen: boolean;
  mode: MusicSelectorMode;
  onClose: () => void;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  activeConversionId: string;
  onRootNoteChange: (note: string) => void;
  onNoteCollectionChange: (key: NoteCollectionKey) => void;
  onConversionChange: (id: string) => void;
}

export function MusicSelectorDialog({
  isOpen,
  mode,
  onClose,
  rootNote,
  noteCollectionKey,
  activeConversionId,
  onRootNoteChange,
  onNoteCollectionChange,
  onConversionChange,
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

  const renderContent = () => {
    switch (mode) {
      case "root":
        return (
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
                      onClick={() => {
                        onRootNoteChange(note);
                        onClose();
                      }}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      case "collection":
        return (
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
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      {Object.entries(groupCollections).map(
                        ([key, collection]) => (
                          <button
                            key={key}
                            type="button"
                            className={styles.collectionButton}
                            aria-pressed={noteCollectionKey === key}
                            onClick={() => {
                              onNoteCollectionChange(key as NoteCollectionKey);
                              onClose();
                            }}
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
        );
      case "format":
        return (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Display Format</h3>
            <div className={styles.collectionList}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {Object.values(conversions.rootAndNoteCollection).map(
                  (conversion) => (
                    <button
                      key={conversion.id}
                      type="button"
                      className={styles.collectionButton}
                      aria-pressed={activeConversionId === conversion.id}
                      onClick={() => {
                        onConversionChange(conversion.id);
                        onClose();
                      }}
                    >
                      {conversion.name}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className={styles.collectionButton}
                  aria-pressed={activeConversionId === "midi"}
                  onClick={() => {
                    onConversionChange("midi");
                    onClose();
                  }}
                >
                  MIDI Note
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "root":
        return "Select Root Note";
      case "collection":
        return "Select Scale Strategy";
      case "format":
        return "Select Display Format";
      default:
        return "Settings";
    }
  };

  return (
    <dialog
      data-component="MusicSelectorDialog"
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
        <h2 className={styles.title}>{getTitle()}</h2>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.content}>{renderContent()}</div>
    </dialog>
  );
}
