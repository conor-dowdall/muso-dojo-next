"use client";

import { formatMidiNote } from "@musodojo/music-theory-data";
import { type SyntheticEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { DisclosureListPanelActions } from "@/components/ui/disclosure-list/DisclosureList";
import { NamedLibraryItemSaveField } from "@/components/ui/named-library-item/NamedLibraryItemSaveField";
import {
  CUSTOM_TUNING_MAX_MIDI,
  CUSTOM_TUNING_MAX_STRINGS,
  CUSTOM_TUNING_MIN_MIDI,
  CUSTOM_TUNING_MIN_STRINGS,
  normalizeCustomTuningName,
  tuningNotesAreEqual,
} from "@/utils/fretboard/customFretboardTunings";
import styles from "./CustomTuningEditor.module.css";

interface CustomTuningEditorProps {
  initialName?: string;
  initialOpenMidiNotes: readonly number[];
  isNameAvailable?: (name: string) => boolean;
  onSave: (openMidiNotes: readonly number[], name?: string) => void;
  showNameField?: boolean;
}

function changeStringCount(notes: readonly number[], nextCount: number) {
  let nextNotes = [...notes];

  while (nextNotes.length < nextCount) {
    const firstNote = nextNotes[0] ?? 60;
    nextNotes = [Math.max(CUSTOM_TUNING_MIN_MIDI, firstNote - 5), ...nextNotes];
  }

  while (nextNotes.length > nextCount) {
    nextNotes = nextNotes.slice(1);
  }

  return nextNotes;
}

function getDisplayStrings(openMidiNotes: readonly number[]) {
  return openMidiNotes
    .map((midi, conventionalIndex) => ({
      conventionalIndex,
      midi,
      stringNumber: openMidiNotes.length - conventionalIndex,
    }))
    .reverse();
}

export function CustomTuningEditor({
  initialName = "",
  initialOpenMidiNotes,
  isNameAvailable = () => true,
  onSave,
  showNameField = false,
}: CustomTuningEditorProps) {
  const [name, setName] = useState(initialName);
  const [openMidiNotes, setOpenMidiNotes] = useState([...initialOpenMidiNotes]);
  const normalizedName = normalizeCustomTuningName(name);
  const normalizedInitialName = normalizeCustomTuningName(initialName);
  const hasNameConflict =
    normalizedName !== undefined && !isNameAvailable(normalizedName);
  const nameMessage = hasNameConflict ? "That name is already in use." : "";
  const notesChanged = !tuningNotesAreEqual(
    openMidiNotes,
    initialOpenMidiNotes,
  );
  const nameChanged = normalizedName !== normalizedInitialName;
  const hasInitialName = normalizedInitialName !== undefined;
  const canSave = showNameField
    ? normalizedName !== undefined &&
      !hasNameConflict &&
      (!hasInitialName || nameChanged || notesChanged)
    : notesChanged;

  const save = () => {
    if (!canSave) {
      return;
    }

    onSave(openMidiNotes, normalizedName);
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    save();
  };

  return (
    <div className={styles.editor}>
      <div className={styles.countRow}>
        <NumericStepper
          aria-label="String count"
          formatValue={(value) =>
            `${value} ${value === 1 ? "string" : "strings"}`
          }
          max={CUSTOM_TUNING_MAX_STRINGS}
          min={CUSTOM_TUNING_MIN_STRINGS}
          value={openMidiNotes.length}
          onChange={(count) =>
            setOpenMidiNotes(changeStringCount(openMidiNotes, count))
          }
        />
      </div>

      <div
        className={styles.stringList}
        role="group"
        aria-label="Open strings from top to bottom"
      >
        {getDisplayStrings(openMidiNotes).map(
          ({ conventionalIndex, midi, stringNumber }) => {
            return (
              <div className={styles.stringRow} key={stringNumber}>
                <span className={styles.stringNumber} aria-hidden="true">
                  {stringNumber}
                </span>
                <NumericStepper
                  aria-label={`String ${stringNumber} open note`}
                  formatValue={formatMidiNote}
                  max={CUSTOM_TUNING_MAX_MIDI}
                  min={CUSTOM_TUNING_MIN_MIDI}
                  value={midi}
                  onChange={(note) =>
                    setOpenMidiNotes((currentNotes) =>
                      currentNotes.map((currentNote, currentIndex) =>
                        currentIndex === conventionalIndex ? note : currentNote,
                      ),
                    )
                  }
                />
              </div>
            );
          },
        )}
      </div>

      {showNameField ? (
        <form className={styles.nameForm} onSubmit={handleSubmit}>
          <NamedLibraryItemSaveField
            disabled={!canSave}
            errorMessage={nameMessage || undefined}
            label="Tuning Name"
            saveAriaLabel="Save tuning"
            value={name}
            onChange={setName}
          />
        </form>
      ) : (
        <DisclosureListPanelActions>
          <Button
            disabled={!canSave}
            label="Save"
            preventConcurrentClicks
            size="sm"
            onClick={save}
          />
        </DisclosureListPanelActions>
      )}
    </div>
  );
}
