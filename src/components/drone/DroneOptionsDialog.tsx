"use client";

import { AudioWaveform, PanelsTopLeft } from "lucide-react";
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
import { WoodSurfaceChoiceList } from "@/components/appearance/WoodSurfaceChoiceList";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import { woodSurfaces, type WoodSurfaceId } from "@/data/woodSurfaces";

type DroneMenuChoice = "sound" | "wood";

interface DroneOptionsDialogProps {
  audioPresetId: AudioPresetId;
  isOpen: boolean;
  onAudioPresetIdChange: SettingSetter<AudioPresetId>;
  onClose: () => void;
  onRemove?: () => void;
  onWoodChange: SettingSetter<WoodSurfaceId>;
  wood: WoodSurfaceId;
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
  onWoodChange,
  wood,
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

        <DisclosureListItem
          ariaLabel={`Wood. Current: ${woodSurfaces[wood].title}`}
          icon={<PanelsTopLeft />}
          isOpen={isChoiceOpen("wood")}
          label="Wood"
          onToggle={() => toggleChoice("wood")}
          panelVariant="menu"
          preview={<WoodSurfaceSwatch surfaceId={wood} />}
          subtitle={woodSurfaces[wood].title}
        >
          <WoodSurfaceChoiceList value={wood} onChange={onWoodChange} />
        </DisclosureListItem>
      </DisclosureListGroup>

      <ObjectManagementGroup
        kind="drone"
        onDanger={onRemove ? handleRemove : undefined}
      />
    </ObjectMenuDialog>
  );
}
