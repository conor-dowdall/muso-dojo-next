"use client";

import { Drum } from "lucide-react";
import {
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import {
  DEFAULT_RHYTHM_PRESET_ID,
  getRhythmSelectionLabel,
  getRhythmSelectionPresetId,
  type RhythmPresetId,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import { RhythmPresetChoiceList } from "./RhythmPresetChoiceList";

type RhythmMenuChoice = "rhythm";

export function RhythmOptionsDialog({
  isOpen,
  onClone,
  onClose,
  onRemove,
  onRhythmPresetIdChange,
  rhythm,
}: {
  isOpen: boolean;
  onClone?: () => void;
  onClose: () => void;
  onRemove?: () => void;
  onRhythmPresetIdChange?: (value: RhythmPresetId) => void;
  rhythm: RhythmSelection;
}) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<RhythmMenuChoice>("rhythm");
  const rhythmLabel = getRhythmSelectionLabel(rhythm);
  const selectedPresetId =
    getRhythmSelectionPresetId(rhythm) ?? DEFAULT_RHYTHM_PRESET_ID;

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Rhythm Options" onClose={onClose}>
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Rhythm. Current: ${rhythmLabel}`}
          icon={<Drum />}
          isOpen={isChoiceOpen("rhythm")}
          label="Rhythm"
          onToggle={() => toggleChoice("rhythm")}
          panelVariant="menu"
          preview={rhythmLabel}
        >
          <RhythmPresetChoiceList
            disabled={!onRhythmPresetIdChange}
            selectedPresetId={selectedPresetId}
            onChange={(presetId) => onRhythmPresetIdChange?.(presetId)}
          />
        </DisclosureListItem>
      </DisclosureListGroup>

      <ObjectManagementGroup
        kind="rhythm"
        onDanger={
          onRemove
            ? () => {
                onRemove();
                onClose();
              }
            : undefined
        }
        onDuplicate={
          onClone
            ? () => {
                onClone();
                onClose();
              }
            : undefined
        }
      />
    </ObjectMenuDialog>
  );
}
