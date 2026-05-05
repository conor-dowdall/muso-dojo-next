"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { type AddInstrumentHandler } from "@/types/workspace";
import {
  defaultFretboardInstrumentSelection,
  defaultKeyboardInstrumentSelection,
  getFretboardInstrumentCreationConfig,
  getKeyboardInstrumentCreationConfig,
  InstrumentCreationSettingsMenu,
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "./InstrumentCreationSettingsMenu";
import { type AddableMusicGroupItemType } from "./addToMusicGroupOptions";
import styles from "./AddToMusicGroupDialog.module.css";

interface AddToMusicGroupDialogProps {
  onAddInstrument: AddInstrumentHandler;
  onClose: () => void;
}

export function AddToMusicGroupDialog({
  onAddInstrument,
  onClose,
}: AddToMusicGroupDialogProps) {
  const [selectedItemType, setSelectedItemType] =
    useState<AddableMusicGroupItemType>("keyboard");
  const [keyboardSelection, setKeyboardSelection] =
    useState<KeyboardInstrumentSelection>(defaultKeyboardInstrumentSelection);
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardInstrumentSelection>(defaultFretboardInstrumentSelection);

  const addLabel =
    selectedItemType === "keyboard" ? "Add Keyboard" : "Add Fretboard";

  const handleAddToMusicGroup = () => {
    if (selectedItemType === "keyboard") {
      onAddInstrument(
        "keyboard",
        getKeyboardInstrumentCreationConfig(keyboardSelection),
      );
      onClose();
      return;
    }

    onAddInstrument(
      "fretboard",
      getFretboardInstrumentCreationConfig(fretboardSelection),
    );
    onClose();
  };

  return (
    <>
      <DialogHeader title="Add to Group" onClose={onClose} />
      <DialogContent className={styles.content}>
        <section className={styles.section} aria-label="Instrument type">
          <InstrumentCreationSettingsMenu
            fretboardSelection={fretboardSelection}
            instrumentType={selectedItemType}
            keyboardSelection={keyboardSelection}
            onFretboardSelectionChange={setFretboardSelection}
            onInstrumentTypeChange={setSelectedItemType}
            onKeyboardSelectionChange={setKeyboardSelection}
          />
        </section>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section className={styles.summarySection} aria-label="Selection">
          <Button
            label={addLabel}
            size="lg"
            variant="filled"
            onClick={handleAddToMusicGroup}
          />
        </section>
      </DialogFooter>
    </>
  );
}
