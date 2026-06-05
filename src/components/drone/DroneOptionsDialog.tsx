"use client";

import { AudioWaveform } from "lucide-react";
import { audioPresets, musoAudioEngine, type AudioPresetId } from "@/audio";
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

type DroneMenuChoice = "sound";

interface DroneOptionsDialogProps {
  audioPresetId: AudioPresetId;
  isOpen: boolean;
  onAudioPresetIdChange: SettingSetter<AudioPresetId>;
  onClose: () => void;
  onRemove?: () => void;
}

function auditionAudioPreset(audioPresetId: AudioPresetId) {
  void musoAudioEngine.playNote({
    midiNote: 48,
    presetId: audioPresetId,
    use: "drone",
    velocity: 0.72,
  });
}

export function DroneOptionsDialog({
  audioPresetId,
  isOpen,
  onAudioPresetIdChange,
  onClose,
  onRemove,
}: DroneOptionsDialogProps) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<DroneMenuChoice>(null);
  const resolvedAudioPreset = audioPresets[audioPresetId];

  const handleAudioPresetChange = (nextAudioPresetId: AudioPresetId) => {
    onAudioPresetIdChange(nextAudioPresetId);
    auditionAudioPreset(nextAudioPresetId);
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Drone Options" onClose={onClose}>
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Playback sound. Current: ${resolvedAudioPreset.label}`}
          icon={<AudioWaveform />}
          isOpen={isChoiceOpen("sound")}
          label="Playback Sound"
          onToggle={() => toggleChoice("sound")}
          panelVariant="menu"
          preview={resolvedAudioPreset.label}
        >
          <AudioPresetChoiceList
            getChoiceAriaLabel={(preset) =>
              `Use ${preset.label} playback sound`
            }
            onChange={handleAudioPresetChange}
            recommendedUse="drone"
            selectedPresetId={audioPresetId}
          />
        </DisclosureListItem>
      </DisclosureListGroup>

      <ObjectManagementGroup
        kind="drone"
        onDanger={onRemove ? handleRemove : undefined}
      />
    </ObjectMenuDialog>
  );
}
