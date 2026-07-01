"use client";

import { AudioWaveform, SwatchBook, WavesArrowUp } from "lucide-react";
import {
  audioPresets,
  ensureAudioReady,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
import { WoodSurfaceDisclosureItem } from "@/components/appearance/WoodSurfaceChoiceList";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import {
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import { type WoodSurfaceId } from "@/data/woodSurfaces";
import {
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import { getExerciseBaseOctave } from "@/utils/exercise-looper/exerciseSequence";

type MenuChoice = "sound" | "octave" | "wood";

function auditionPlaybackSound(
  audioPresetId: AudioPresetId,
  midiNote: number | undefined,
) {
  if (midiNote === undefined) {
    return;
  }

  void ensureAudioReady();
  void musoAudioEngine.playNote({
    midiNote,
    presetId: audioPresetId,
    use: "exercise",
  });
}

function formatExerciseOctave(octaveOffset: number) {
  return `Octave ${getExerciseBaseOctave(octaveOffset)}`;
}

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
              if (!isPlaybackActive) {
                auditionPlaybackSound(nextPresetId, previewMidiNote);
              }
            }}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Octave. Current: ${formatExerciseOctave(octaveOffset)}`}
          icon={<WavesArrowUp />}
          isOpen={isChoiceOpen("octave")}
          label="Octave"
          preview={formatExerciseOctave(octaveOffset)}
          panelVariant="menu"
          onToggle={() => toggleChoice("octave")}
        >
          <NumericStepper
            aria-label="Looper octave"
            canDecrease={canShiftOctaveDown}
            canIncrease={canShiftOctaveUp}
            disabled={!onOctaveOffsetChange}
            formatValue={formatExerciseOctave}
            max={EXERCISE_MAX_OCTAVE_OFFSET}
            min={EXERCISE_MIN_OCTAVE_OFFSET}
            value={octaveOffset}
            onChange={(value) => onOctaveOffsetChange?.(value)}
          />
        </DisclosureListItem>

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
