"use client";

import { ArrowUpDown, AudioWaveform, Drum } from "lucide-react";
import {
  audioPresets,
  ensureAudioReady,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import {
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  formatPracticeBandOctave,
  type ResolvedPracticeBandConfig,
} from "@/utils/practice-band/practiceBandConfig";

type PracticeBandMenuChoice = "sound" | "octave";

const practiceBandOctaveChoices = Array.from(
  { length: EXERCISE_MAX_OCTAVE_OFFSET - EXERCISE_MIN_OCTAVE_OFFSET + 1 },
  (_, index) => EXERCISE_MIN_OCTAVE_OFFSET + index,
);

function auditionPracticeBandSound(audioPresetId: AudioPresetId) {
  void ensureAudioReady();
  void musoAudioEngine.playNote({
    midiNote: 36,
    presetId: audioPresetId,
    use: "exercise",
  });
}

interface PracticeBandOptionsDialogProps {
  config: ResolvedPracticeBandConfig;
  isOpen: boolean;
  onAudioPresetIdChange: (audioPresetId: AudioPresetId) => void;
  onClose: () => void;
  onDrumsChange: (drums: boolean) => void;
  onOctaveOffsetChange: (octaveOffset: number) => void;
}

export function PracticeBandOptionsDialog({
  config,
  isOpen,
  onAudioPresetIdChange,
  onClose,
  onDrumsChange,
  onOctaveOffsetChange,
}: PracticeBandOptionsDialogProps) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<PracticeBandMenuChoice>(null);
  const preset = audioPresets[config.audioPresetId];
  const octaveLabel = formatPracticeBandOctave(config.octaveOffset);

  return (
    <ObjectMenuDialog
      isOpen={isOpen}
      title="Practice Band Options"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <DisclosureListAction
          aria-label={
            config.drums
              ? "Mute Practice Band drums"
              : "Use Practice Band drums"
          }
          icon={<Drum />}
          label="Drums"
          preview={config.drums ? "On" : "Off"}
          selected={config.drums}
          selectionSemantics="visual"
          onClick={() => onDrumsChange(!config.drums)}
        />

        <DisclosureListItem
          ariaLabel={`Backing sound. Current: ${preset.label}`}
          icon={<AudioWaveform />}
          isOpen={isChoiceOpen("sound")}
          label="Backing Sound"
          panelVariant="menu"
          preview={preset.label}
          onToggle={() => toggleChoice("sound")}
        >
          <AudioPresetChoiceList
            getChoiceAriaLabel={(choice) =>
              `Use ${choice.label} Practice Band backing sound`
            }
            selectedPresetId={config.audioPresetId}
            surface="exercise"
            onChange={(nextPresetId) => {
              onAudioPresetIdChange(nextPresetId);
              auditionPracticeBandSound(nextPresetId);
            }}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Generated backing octave. Current: ${octaveLabel}`}
          icon={<ArrowUpDown />}
          isOpen={isChoiceOpen("octave")}
          label="Generated Octave"
          panelVariant="menu"
          preview={octaveLabel}
          onToggle={() => toggleChoice("octave")}
        >
          <DisclosureList density="compact">
            {practiceBandOctaveChoices.map((octaveOffset) => {
              const label = formatPracticeBandOctave(octaveOffset);

              return (
                <DisclosureListChoice
                  key={octaveOffset}
                  aria-label={`Use ${label} for generated Practice Band backing`}
                  label={label}
                  selected={octaveOffset === config.octaveOffset}
                  onClick={() => onOctaveOffsetChange(octaveOffset)}
                />
              );
            })}
          </DisclosureList>
        </DisclosureListItem>
      </DisclosureListGroup>
    </ObjectMenuDialog>
  );
}
