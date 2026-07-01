"use client";

import { AudioWaveform, SwatchBook, WavesArrowUp } from "lucide-react";
import {
  audioPresets,
  ensureAudioReady,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
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
import { OctaveOffsetStepper } from "@/components/part-module/OctaveOffsetStepper";
import { type SettingSetter } from "@/types/state";
import { WoodSurfaceChoiceList } from "@/components/appearance/WoodSurfaceChoiceList";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import { woodSurfaces, type WoodSurfaceId } from "@/data/woodSurfaces";
import {
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_OFFSET,
  getDroneBaseOctave,
} from "@/utils/drone/droneNotes";

type DroneMenuChoice = "sound" | "octave" | "appearance";

interface DroneOptionsDialogProps {
  audioPresetId: AudioPresetId;
  canShiftOctaveDown?: boolean;
  canShiftOctaveUp?: boolean;
  isOpen: boolean;
  onAudioPresetIdChange: SettingSetter<AudioPresetId>;
  onClose: () => void;
  onOctaveOffsetChange: SettingSetter<number>;
  onRemove?: () => void;
  onWoodChange: SettingSetter<WoodSurfaceId>;
  octaveOffset: number;
  wood: WoodSurfaceId;
}

function auditionAudioPreset(audioPresetId: AudioPresetId) {
  void ensureAudioReady();
  void musoAudioEngine.playNote({
    midiNote: 48,
    presetId: audioPresetId,
    use: "drone",
    velocity: 0.72,
  });
}

function formatDroneOctave(octaveOffset: number) {
  return `Octave ${getDroneBaseOctave(octaveOffset)}`;
}

export function DroneOptionsDialog({
  audioPresetId,
  canShiftOctaveDown,
  canShiftOctaveUp,
  isOpen,
  onAudioPresetIdChange,
  onClose,
  onOctaveOffsetChange,
  onRemove,
  onWoodChange,
  octaveOffset,
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
            selectedPresetId={audioPresetId}
            surface="drone"
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Octave. Current: ${formatDroneOctave(octaveOffset)}`}
          icon={<WavesArrowUp />}
          isOpen={isChoiceOpen("octave")}
          label="Octave"
          onToggle={() => toggleChoice("octave")}
          panelVariant="menu"
          preview={formatDroneOctave(octaveOffset)}
        >
          <OctaveOffsetStepper
            aria-label="Drone octave"
            canDecrease={canShiftOctaveDown}
            canIncrease={canShiftOctaveUp}
            formatValue={formatDroneOctave}
            max={DRONE_MAX_OCTAVE_OFFSET}
            min={DRONE_MIN_OCTAVE_OFFSET}
            value={octaveOffset}
            onChange={onOctaveOffsetChange}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Appearance. Current: ${woodSurfaces[wood].title}`}
          icon={<SwatchBook />}
          isOpen={isChoiceOpen("appearance")}
          label="Appearance"
          onToggle={() => toggleChoice("appearance")}
          panelVariant="menu"
          preview={<WoodSurfaceSwatch surfaceId={wood} />}
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
