"use client";

import { AudioWaveform, SwatchBook } from "lucide-react";
import {
  audioPresets,
  ensureAudioReady,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
import { WoodSurfaceChoiceList } from "@/components/appearance/WoodSurfaceChoiceList";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import {
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import { woodSurfaces, type WoodSurfaceId } from "@/data/woodSurfaces";

type MenuChoice = "sound" | "appearance";

export function ExerciseLooperOptionsDialog({
  audioPresetId,
  isOpen,
  onAudioPresetIdChange,
  onClone,
  onClose,
  onRemove,
  onWoodChange,
  wood,
}: {
  audioPresetId: AudioPresetId;
  isOpen: boolean;
  onAudioPresetIdChange: (value: AudioPresetId) => void;
  onClone?: () => void;
  onClose: () => void;
  onRemove?: () => void;
  onWoodChange: (value: WoodSurfaceId) => void;
  wood: WoodSurfaceId;
}) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<MenuChoice>(null);
  const preset = audioPresets[audioPresetId];

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Looper Options" onClose={onClose}>
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Playback sound. Current: ${preset.label}`}
          icon={<AudioWaveform />}
          isOpen={isChoiceOpen("sound")}
          label="Playback Sound"
          preview={preset.label}
          panelVariant="menu"
          onToggle={() => toggleChoice("sound")}
        >
          <AudioPresetChoiceList
            getChoiceAriaLabel={(choice) =>
              `Use ${choice.label} playback sound`
            }
            selectedPresetId={audioPresetId}
            surface="exercise"
            onChange={(nextPresetId) => {
              onAudioPresetIdChange(nextPresetId);
              void ensureAudioReady();
              void musoAudioEngine.playNote({
                midiNote: 60,
                presetId: nextPresetId,
                use: "exercise",
              });
            }}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Appearance. Current: ${woodSurfaces[wood].title}`}
          icon={<SwatchBook />}
          isOpen={isChoiceOpen("appearance")}
          label="Appearance"
          preview={<WoodSurfaceSwatch surfaceId={wood} />}
          panelVariant="menu"
          onToggle={() => toggleChoice("appearance")}
        >
          <WoodSurfaceChoiceList value={wood} onChange={onWoodChange} />
        </DisclosureListItem>
      </DisclosureListGroup>

      <ObjectManagementGroup
        kind="exercise looper"
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
