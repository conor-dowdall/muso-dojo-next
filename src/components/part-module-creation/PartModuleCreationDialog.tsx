"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { DisclosureList } from "@/components/ui/disclosure-list/DisclosureList";
import {
  type AddPartModuleHandler,
  type InstrumentType,
} from "@/types/session";
import {
  createDefaultInstrumentSelections,
  getDefaultInstrumentType,
  getInstrumentCreationDefault,
  instrumentCreationDefaultMatchesSelection,
  type FretboardInstrumentSelection,
  type InstrumentCreationRangeContext,
  type KeyboardInstrumentSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import { InstrumentCreationDefaultAction } from "@/components/instrument-creation/InstrumentCreationDefaultAction";
import { useAppStore } from "@/stores/appStore";
import { DEFAULT_PART_MODULE_TYPE } from "@/utils/session/sessionDefaults";
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
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  onAddPartModule: AddPartModuleHandler;
  onClose: () => void;
  title?: string;
}

export function PartModuleCreationDialog({
  instrumentCreationRangeContext,
  onAddPartModule,
  onClose,
  title = "Add to Part",
}: PartModuleCreationDialogProps) {
  const selectedModuleType = DEFAULT_PART_MODULE_TYPE;
  const defaultInstrumentSetup = useAppStore(
    (state) => state.preferences.defaultInstrumentSetup,
  );
  const setDefaultInstrumentSetup = useAppStore(
    (state) => state.setDefaultInstrumentSetup,
  );
  const [initialSelections] = useState(() =>
    createDefaultInstrumentSelections(
      undefined,
      defaultInstrumentSetup,
      instrumentCreationRangeContext,
    ),
  );
  const [selectedInstrumentType, setSelectedInstrumentType] =
    useState<InstrumentType>(() =>
      getDefaultInstrumentType(defaultInstrumentSetup),
    );
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
  const isDefaultInstrumentSetup = instrumentCreationDefaultMatchesSelection(
    selectedInstrumentType,
    defaultInstrumentSetup,
    keyboardSelection,
    fretboardSelection,
  );
  const moduleSettingsProps = {
    ...creationDraft,
    defaultInstrumentSetup,
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
  const handleRememberInstrumentSetup = () => {
    setDefaultInstrumentSetup(
      getInstrumentCreationDefault(
        selectedInstrumentType,
        keyboardSelection,
        fretboardSelection,
      ),
    );
  };

  return (
    <>
      <DialogHeader title={title} onClose={onClose} />
      <DialogContent className={styles.content}>
        <section className={styles.section} aria-label="Module settings">
          <PartModuleCreationSettingsMenu {...moduleSettingsProps} />
        </section>
        <section className={styles.section} aria-label="Creation default">
          <DisclosureList>
            <InstrumentCreationDefaultAction
              fretboardSelection={fretboardSelection}
              instrumentType={selectedInstrumentType}
              isDefault={isDefaultInstrumentSetup}
              keyboardSelection={keyboardSelection}
              onRemember={handleRememberInstrumentSetup}
            />
          </DisclosureList>
        </section>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section className={styles.summarySection} aria-label="Selection">
          <div className={styles.primaryActions}>
            <Button
              label={addLabel}
              size="lg"
              variant="filled"
              onClick={handleAddPartModule}
            />
          </div>
        </section>
      </DialogFooter>
    </>
  );
}
