"use client";

import { AudioWaveform, WavesArrowUp } from "lucide-react";
import {
  audioPresets,
  ensureAudioReady,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { DisclosureListItem } from "@/components/ui/disclosure-list/DisclosureList";
import {
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import { getExerciseBaseOctave } from "@/utils/exercise-looper/exerciseSequence";

export function formatExerciseOctave(octaveOffset: number) {
  return `Octave ${getExerciseBaseOctave(octaveOffset)}`;
}

export function ExercisePlaybackSoundDisclosure({
  audioPresetId,
  disabled,
  isOpen,
  isPlaybackActive = false,
  keepMounted,
  onChange,
  onToggle,
  previewMidiNote,
  showIcon = true,
}: {
  audioPresetId: AudioPresetId;
  disabled?: boolean;
  isOpen: boolean;
  isPlaybackActive?: boolean;
  keepMounted?: boolean;
  onChange: (value: AudioPresetId) => void;
  onToggle: () => void;
  previewMidiNote?: number;
  showIcon?: boolean;
}) {
  const preset = audioPresets[audioPresetId];

  return (
    <DisclosureListItem
      ariaLabel={`Playback sound. Current: ${preset.label}`}
      disabled={disabled}
      icon={showIcon ? <AudioWaveform /> : undefined}
      isOpen={isOpen}
      keepMounted={keepMounted}
      label="Playback Sound"
      preview={preset.label}
      panelVariant="menu"
      onToggle={onToggle}
    >
      <AudioPresetChoiceList
        getChoiceAriaLabel={(choice) => `Use ${choice.label} playback sound`}
        selectedPresetId={audioPresetId}
        surface="exercise"
        onChange={(nextPresetId) => {
          onChange(nextPresetId);
          if (!isPlaybackActive && previewMidiNote !== undefined) {
            void ensureAudioReady();
            void musoAudioEngine.playNote({
              midiNote: previewMidiNote,
              presetId: nextPresetId,
              use: "exercise",
            });
          }
        }}
      />
    </DisclosureListItem>
  );
}

export function ExerciseOctaveDisclosure({
  canDecrease,
  canIncrease,
  disabled,
  isOpen,
  keepMounted,
  octaveOffset,
  onChange,
  onToggle,
  showIcon = true,
}: {
  canDecrease?: boolean;
  canIncrease?: boolean;
  disabled?: boolean;
  isOpen: boolean;
  keepMounted?: boolean;
  octaveOffset: number;
  onChange: (value: number) => void;
  onToggle: () => void;
  showIcon?: boolean;
}) {
  return (
    <DisclosureListItem
      ariaLabel={`Octave. Current: ${formatExerciseOctave(octaveOffset)}`}
      disabled={disabled}
      icon={showIcon ? <WavesArrowUp /> : undefined}
      isOpen={isOpen}
      keepMounted={keepMounted}
      label="Octave"
      preview={formatExerciseOctave(octaveOffset)}
      panelVariant="menu"
      onToggle={onToggle}
    >
      <NumericStepper
        aria-label="Looper octave"
        canDecrease={canDecrease}
        canIncrease={canIncrease}
        disabled={disabled}
        formatValue={formatExerciseOctave}
        max={EXERCISE_MAX_OCTAVE_OFFSET}
        min={EXERCISE_MIN_OCTAVE_OFFSET}
        value={octaveOffset}
        onChange={onChange}
      />
    </DisclosureListItem>
  );
}
