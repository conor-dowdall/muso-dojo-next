"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import {
  type AddPartModuleHandler,
  type InstrumentType,
} from "@/types/session";
import {
  createDefaultInstrumentSelections,
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import {
  DEFAULT_INSTRUMENT_TYPE,
  DEFAULT_PART_MODULE_TYPE,
} from "@/utils/session/sessionDefaults";
import {
  type PartModuleCreationDraft,
  getPartModuleCreationActionLabel,
  getPartModuleCreationConfig,
} from "@/components/part-module-creation/partModuleCreationConfig";
import {
  PartModuleCreationSettingsMenu,
  type PartModuleCreationSettingsMenuProps,
} from "@/components/part-module-creation/PartModuleCreationSettingsMenu";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

interface PartModuleCreationDialogProps {
  onAddPartModule: AddPartModuleHandler;
  onClose: () => void;
  title?: string;
}

export function PartModuleCreationDialog({
  onAddPartModule,
  onClose,
  title = "Add to Part",
}: PartModuleCreationDialogProps) {
  const selectedModuleType = DEFAULT_PART_MODULE_TYPE;
  const [initialSelections] = useState(() =>
    createDefaultInstrumentSelections(),
  );
  const [selectedInstrumentType, setSelectedInstrumentType] =
    useState<InstrumentType>(DEFAULT_INSTRUMENT_TYPE);
  const [keyboardSelection, setKeyboardSelection] =
    useState<KeyboardInstrumentSelection>(initialSelections.keyboardSelection);
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardInstrumentSelection>(
      initialSelections.fretboardSelection,
    );

  const creationDraft = {
    moduleType: selectedModuleType,
    instrumentType: selectedInstrumentType,
    keyboardSelection,
    fretboardSelection,
  } satisfies PartModuleCreationDraft;
  const addLabel = getPartModuleCreationActionLabel(creationDraft);
  const moduleSettingsProps = {
    ...creationDraft,
    onFretboardSelectionChange: setFretboardSelection,
    onInstrumentTypeChange: setSelectedInstrumentType,
    onKeyboardSelectionChange: setKeyboardSelection,
  } satisfies PartModuleCreationSettingsMenuProps;

  const handleAddPartModule = () => {
    const { moduleType, moduleSettings } =
      getPartModuleCreationConfig(creationDraft);

    onAddPartModule(moduleType, moduleSettings);
    onClose();
  };

  return (
    <>
      <DialogHeader title={title} onClose={onClose} />
      <DialogContent className={styles.content}>
        <section className={styles.section} aria-label="Module settings">
          <PartModuleCreationSettingsMenu {...moduleSettingsProps} />
        </section>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section className={styles.summarySection} aria-label="Selection">
          <Button
            label={addLabel}
            size="lg"
            variant="filled"
            onClick={handleAddPartModule}
          />
        </section>
      </DialogFooter>
    </>
  );
}
