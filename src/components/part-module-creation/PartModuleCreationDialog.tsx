"use client";

import { useState } from "react";
import { AudioWaveform, CircleDot } from "lucide-react";
import {
  DialogContent,
  DialogContentSection,
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListChoiceItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  type AddPartModuleHandler,
  type PartModuleType,
} from "@/types/session";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import { InstrumentCreationDefaultAction } from "@/components/instrument-creation/InstrumentCreationDefaultAction";
import { useInstrumentCreationDraft } from "@/components/instrument-creation/useInstrumentCreationDraft";
import { DEFAULT_PART_MODULE_TYPE } from "@/utils/session/sessionDefaults";
import {
  type PartModuleCreationDraft,
  getPartModuleCreationActionLabel,
  getPartModuleCreationRequest,
  partModuleCreationOptions,
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
  const [selectedModuleType, setSelectedModuleType] = useState<PartModuleType>(
    DEFAULT_PART_MODULE_TYPE,
  );
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

  const creationDraft =
    selectedModuleType === "instrument"
      ? ({
          moduleType: selectedModuleType,
          instrumentType,
          keyboardSelection,
          fretboardSelection,
        } satisfies PartModuleCreationDraft)
      : ({
          moduleType: selectedModuleType,
        } satisfies PartModuleCreationDraft);
  const addLabel = getPartModuleCreationActionLabel(creationDraft);
  const moduleSettingsProps =
    creationDraft.moduleType === "instrument"
      ? ({
          ...creationDraft,
          defaultInstrumentSetup,
          onFretboardSelectionChange: setFretboardSelection,
          onInstrumentTypeChange: setInstrumentType,
          onKeyboardSelectionChange: setKeyboardSelection,
        } satisfies PartModuleCreationSettingsMenuProps)
      : ({
          moduleType: "drone",
        } satisfies PartModuleCreationSettingsMenuProps);
  const selectedInstrumentLabel =
    instrumentType === "keyboard" ? "Keyboard" : "Fretboard";

  const handleAddPartModule = () => {
    onAddPartModule(getPartModuleCreationRequest(creationDraft));
    onClose();
  };

  return (
    <>
      <DialogHeader title={title} onClose={onClose} />
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Module type">
          <DisclosureList>
            {partModuleCreationOptions.map((option) => {
              const selected = option.id === selectedModuleType;

              if (option.id === "instrument") {
                return (
                  <DisclosureListChoiceItem
                    key={option.id}
                    ariaLabel="Choose Instrument module"
                    icon={<CircleDot />}
                    isOpen={selected}
                    label={option.label}
                    onToggle={() => setSelectedModuleType(option.id)}
                    panelVariant="menu"
                    preview={selected ? selectedInstrumentLabel : undefined}
                    selected={selected}
                    subtitle={option.subtitle}
                  >
                    <PartModuleCreationSettingsMenu {...moduleSettingsProps} />
                  </DisclosureListChoiceItem>
                );
              }

              return (
                <DisclosureListChoice
                  key={option.id}
                  aria-label="Choose Drone module"
                  icon={<AudioWaveform />}
                  label={option.label}
                  onClick={() => setSelectedModuleType(option.id)}
                  selected={selected}
                  subtitle={option.subtitle}
                />
              );
            })}
          </DisclosureList>
        </DialogContentSection>
        {selectedModuleType === "instrument" ? (
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
        ) : null}
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
