"use client";

import { Repeat, SwatchBook } from "lucide-react";
import { type AudioPresetId } from "@/audio";
import { WoodSurfaceDisclosureItem } from "@/components/appearance/WoodSurfaceChoiceList";
import {
  DisclosureListGroup,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import { type WoodSurfaceId } from "@/data/woodSurfaces";
import {
  ExerciseOctaveDisclosure,
  ExercisePlaybackSoundDisclosure,
} from "./ExerciseVoiceDisclosureItems";
type MenuChoice = "sound" | "octave" | "wood";

export function ExerciseLooperOptionsDialog({
  audioPresetId,
  canShiftOctaveDown,
  canShiftOctaveUp,
  isPlaybackActive = false,
  isOpen,
  onAudioPresetIdChange,
  onClone,
  onClose,
  onOctaveOffsetChange,
  onRemove,
  onWoodChange,
  octaveOffset,
  previewMidiNote,
  wood,
}: {
  audioPresetId: AudioPresetId;
  canShiftOctaveDown: boolean;
  canShiftOctaveUp: boolean;
  isPlaybackActive?: boolean;
  isOpen: boolean;
  onAudioPresetIdChange: (value: AudioPresetId) => void;
  onClone?: () => void;
  onClose: () => void;
  onOctaveOffsetChange?: (value: number) => void;
  onRemove?: () => void;
  onWoodChange: (value: WoodSurfaceId) => void;
  octaveOffset: number;
  previewMidiNote?: number;
  wood: WoodSurfaceId;
}) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<MenuChoice>(null);
  return (
    <ObjectMenuDialog
      icon={<Repeat />}
      isOpen={isOpen}
      title="Looper Options"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <ExercisePlaybackSoundDisclosure
          audioPresetId={audioPresetId}
          isOpen={isChoiceOpen("sound")}
          isPlaybackActive={isPlaybackActive}
          previewMidiNote={previewMidiNote}
          onChange={onAudioPresetIdChange}
          onToggle={() => toggleChoice("sound")}
        />

        <ExerciseOctaveDisclosure
          canDecrease={canShiftOctaveDown}
          canIncrease={canShiftOctaveUp}
          disabled={!onOctaveOffsetChange}
          isOpen={isChoiceOpen("octave")}
          octaveOffset={octaveOffset}
          onChange={(value) => onOctaveOffsetChange?.(value)}
          onToggle={() => toggleChoice("octave")}
        />

        <WoodSurfaceDisclosureItem
          icon={<SwatchBook />}
          isOpen={isChoiceOpen("wood")}
          surfaceId={wood}
          onChange={onWoodChange}
          onToggle={() => toggleChoice("wood")}
        />
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
