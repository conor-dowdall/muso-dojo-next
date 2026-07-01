"use client";

import { useEffect } from "react";
import { AudioWaveform, Drum, Repeat, WavesArrowUp } from "lucide-react";
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
import { SelectionPreviewLabel } from "@/components/ui/selection-preview";
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
  previewSoundOnChange?: boolean;
  onAudioPresetIdChange: (audioPresetId: AudioPresetId) => void;
  onBackingNotesChange: (backingNotes: boolean) => void;
  onClose: () => void;
  onDrumsChange: (drums: boolean) => void;
  onOctaveOffsetChange: (octaveOffset: number) => void;
}

export function PracticeBandOptionsDialog({
  config,
  isOpen,
  previewSoundOnChange = true,
  onAudioPresetIdChange,
  onBackingNotesChange,
  onClose,
  onDrumsChange,
  onOctaveOffsetChange,
}: PracticeBandOptionsDialogProps) {
  const {
    closeAll,
    isOpen: isChoiceOpen,
    toggleChoice,
  } = useDisclosureList<PracticeBandMenuChoice>(null);
  const preset = audioPresets[config.audioPresetId];
  const octaveLabel = formatPracticeBandOctave(config.octaveOffset);
  const includedPreview = () => <SelectionPreviewLabel kind="included" />;

  useEffect(() => {
    if (!config.backingNotes) {
      closeAll();
    }
  }, [closeAll, config.backingNotes]);

  const handleBackingNotesChange = () => {
    const nextBackingNotes = !config.backingNotes;

    if (!nextBackingNotes) {
      closeAll();
    }

    onBackingNotesChange(nextBackingNotes);
  };

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
          preview={config.drums ? includedPreview() : undefined}
          selected={config.drums}
          selectionSemantics="visual"
          onClick={() => onDrumsChange(!config.drums)}
        />

        <DisclosureListAction
          aria-label={
            config.backingNotes
              ? "Mute Practice Band backing notes"
              : "Use Practice Band backing notes"
          }
          icon={<Repeat />}
          label="Backing Notes"
          preview={config.backingNotes ? includedPreview() : undefined}
          selected={config.backingNotes}
          selectionSemantics="visual"
          onClick={handleBackingNotesChange}
        />

        <DisclosureListItem
          ariaLabel={`Backing sound. Current: ${preset.label}`}
          disabled={!config.backingNotes}
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
              if (previewSoundOnChange) {
                auditionPracticeBandSound(nextPresetId);
              }
            }}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Backing octave. Current: ${octaveLabel}`}
          disabled={!config.backingNotes}
          icon={<WavesArrowUp />}
          isOpen={isChoiceOpen("octave")}
          label="Backing Octave"
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
                  aria-label={`Use ${label} for Practice Band backing octave`}
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
