"use client";

import { formatMidiNote } from "@musodojo/music-theory-data";
import { Check } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import fieldStyles from "@/components/ui/control-field/ControlField.module.css";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { Text } from "@/components/ui/typography/Text";
import { DisclosureListPanelActions } from "@/components/ui/disclosure-list/DisclosureList";
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

export function CustomTuningEditor({
  initialName = "",
  initialOpenMidiNotes,
  isNameAvailable = () => true,
  onSave,
  showNameField = false,
}: CustomTuningEditorProps) {
  const nameInputId = useId();
  const nameMessageId = useId();
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

  const handleSave = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!canSave) {
      return;
    }

    onSave(openMidiNotes, normalizedName);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.countRow}>
        <Text
          as="span"
          className={styles.rowLabel}
          size="sm"
          variant="muted"
          weight="medium"
        >
          Strings
        </Text>
        <NumericStepper
          aria-label="String count"
          formatValue={(value) =>
            `${value} ${value === 1 ? "String" : "Strings"}`
          }
          max={CUSTOM_TUNING_MAX_STRINGS}
          min={CUSTOM_TUNING_MIN_STRINGS}
          value={openMidiNotes.length}
          onChange={(count) =>
            setOpenMidiNotes(changeStringCount(openMidiNotes, count))
          }
        />
      </div>

      <div className={styles.stringList} role="group" aria-label="Open strings">
        {openMidiNotes.map((midi, index) => {
          const stringNumber = openMidiNotes.length - index;

          return (
            <div className={styles.stringRow} key={`${stringNumber}-${index}`}>
              <Text
                as="span"
                className={styles.rowLabel}
                size="sm"
                variant="muted"
                weight="medium"
              >
                String {stringNumber}
              </Text>
              <NumericStepper
                aria-label={`String ${stringNumber} open note`}
                formatValue={formatMidiNote}
                max={CUSTOM_TUNING_MAX_MIDI}
                min={CUSTOM_TUNING_MIN_MIDI}
                value={midi}
                onChange={(note) =>
                  setOpenMidiNotes((currentNotes) =>
                    currentNotes.map((currentNote, currentIndex) =>
                      currentIndex === index ? note : currentNote,
                    ),
                  )
                }
              />
            </div>
          );
        })}
      </div>

      {showNameField ? (
        <form className={styles.nameForm} onSubmit={handleSave}>
          <div className={styles.nameField}>
            <label className={styles.nameLabel} htmlFor={nameInputId}>
              Tuning Name
            </label>
            <div className={styles.nameControl}>
              <input
                aria-describedby={nameMessage ? nameMessageId : undefined}
                aria-invalid={hasNameConflict || undefined}
                autoComplete="off"
                className={`${fieldStyles.surface} ${fieldStyles.text} ${styles.nameInput}`}
                id={nameInputId}
                placeholder="Tuning Name"
                spellCheck={false}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <IconButton
                aria-label="Save tuning"
                disabled={!canSave}
                icon={<Check />}
                shouldYield={false}
                size="lg"
                type="submit"
              />
            </div>
            {nameMessage ? (
              <Text
                as="span"
                className={styles.message}
                id={nameMessageId}
                size="xs"
                variant="muted"
              >
                {nameMessage}
              </Text>
            ) : null}
          </div>
        </form>
      ) : (
        <DisclosureListPanelActions>
          <Button
            disabled={!canSave}
            label="Save"
            size="sm"
            onClick={() => handleSave()}
          />
        </DisclosureListPanelActions>
      )}
    </div>
  );
}
