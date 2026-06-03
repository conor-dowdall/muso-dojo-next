"use client";

import { AudioWaveform } from "lucide-react";
import { audioPresets, type AudioPresetId } from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
import {
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import { type SettingSetter } from "@/types/state";
import { resolveDroneAudioPresetId } from "@/utils/drone/resolveDroneAudioPreset";

interface DroneOptionsDialogProps {
  audioPresetId?: AudioPresetId;
  isOpen: boolean;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onClone?: () => void;
  onClose: () => void;
  onRemove?: () => void;
}

export function DroneOptionsDialog({
  audioPresetId,
  isOpen,
  onAudioPresetIdChange,
  onClone,
  onClose,
  onRemove,
}: DroneOptionsDialogProps) {
  const { isOpen: isChoiceOpen, toggleChoice } = useDisclosureList<"tone">();
  const resolvedAudioPresetId = resolveDroneAudioPresetId(audioPresetId);
  const resolvedAudioPreset = audioPresets[resolvedAudioPresetId];

  const handleAudioPresetChange = (nextAudioPresetId: AudioPresetId) => {
    onAudioPresetIdChange?.(nextAudioPresetId);
  };

  const handleClone = () => {
    onClone?.();
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Drone Options" onClose={onClose}>
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Drone tone. Current: ${resolvedAudioPreset.label}`}
          icon={<AudioWaveform />}
          isOpen={isChoiceOpen("tone")}
          label="Tone"
          onToggle={() => toggleChoice("tone")}
          panelVariant="menu"
          preview={resolvedAudioPreset.label}
        >
          <AudioPresetChoiceList
            disabled={!onAudioPresetIdChange}
            getChoiceAriaLabel={(preset) => `Use ${preset.label} drone tone`}
            onChange={handleAudioPresetChange}
            recommendedUse="drone"
            selectedPresetId={resolvedAudioPresetId}
          />
        </DisclosureListItem>
      </DisclosureListGroup>

      <ObjectManagementGroup
        kind="drone"
        onDuplicate={onClone ? handleClone : undefined}
        onDanger={onRemove ? handleRemove : undefined}
      />
    </ObjectMenuDialog>
  );
}
