"use client";

import {
  DialogContent,
  DialogContentSection,
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { DisclosureList } from "@/components/ui/disclosure-list/DisclosureList";
import { type AddPartModuleHandler } from "@/types/session";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import { InstrumentCreationDefaultAction } from "@/components/instrument-creation/InstrumentCreationDefaultAction";
import { useInstrumentCreationDraft } from "@/components/instrument-creation/useInstrumentCreationDraft";
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
  const {
    defaultInstrumentSetup,
    fretboardSelection,
    instrumentType,
    isDefaultInstrumentSetup,
    keyboardSelection,
    setFretboardSelection,
    setInstrumentType,
    setKeyboardSelection,
    useCurrentSetupForNewInstruments,
  } = useInstrumentCreationDraft(instrumentCreationRangeContext);

  const creationDraft = {
    moduleType: selectedModuleType,
    instrumentType,
    keyboardSelection,
    fretboardSelection,
  } satisfies PartModuleCreationDraft;
  const addLabel = getPartModuleCreationActionLabel(creationDraft);
  const moduleSettingsProps = {
    ...creationDraft,
    defaultInstrumentSetup,
    onFretboardSelectionChange: setFretboardSelection,
    onInstrumentTypeChange: setInstrumentType,
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
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Module settings">
          <PartModuleCreationSettingsMenu {...moduleSettingsProps} />
        </DialogContentSection>
        <DialogContentSection ariaLabel="Creation default">
          <DisclosureList>
            <InstrumentCreationDefaultAction
              fretboardSelection={fretboardSelection}
              instrumentType={instrumentType}
              isDefault={isDefaultInstrumentSetup}
              keyboardSelection={keyboardSelection}
              onUseForNewInstruments={useCurrentSetupForNewInstruments}
            />
          </DisclosureList>
        </DialogContentSection>
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Selection">
          <DialogFooterActionGroup placement="primary">
            <Button
              label={addLabel}
              size="lg"
              variant="filled"
              onClick={handleAddPartModule}
            />
          </DialogFooterActionGroup>
        </DialogFooterActionBar>
      </DialogFooter>
    </>
  );
}
