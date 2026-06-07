"use client";

import {
  AudioWaveform,
  Gauge,
  ListMusic,
  PanelsTopLeft,
  Ruler,
} from "lucide-react";
import { audioPresets, musoAudioEngine, type AudioPresetId } from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
import { WoodSurfaceChoiceList } from "@/components/appearance/WoodSurfaceChoiceList";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import { BoundedRangeSliderGroup } from "@/components/ui/range-slider/BoundedRangeSliderGroup";
import { woodSurfaces, type WoodSurfaceId } from "@/data/woodSurfaces";
import { type ExerciseSubdivision } from "@/types/session";
import {
  exercisePatternsAreEqual,
  DEFAULT_EXERCISE_END,
  DEFAULT_EXERCISE_START,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  getCollectionPosition,
  getExerciseIntervalRunLabel,
  getExerciseStackLabel,
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";

type MenuChoice = "pattern" | "subdivision" | "range" | "sound" | "wood";

const scalePatterns = [
  { direction: "ascending", kind: "scale", label: "Ascending" },
  { direction: "descending", kind: "scale", label: "Descending" },
  { direction: "up-down", kind: "scale", label: "Up and Down" },
] as const;

const subdivisions = [
  { id: "quarter", label: "Quarter Notes" },
  { id: "eighth", label: "Eighth Notes" },
  { id: "eighth-triplet", label: "Eighth-Note Triplets" },
  { id: "sixteenth", label: "Sixteenth Notes" },
  { id: "sixteenth-triplet", label: "Sixteenth-Note Triplets" },
] as const satisfies readonly { id: ExerciseSubdivision; label: string }[];

function patternLabel(pattern: ExercisePattern) {
  if (pattern.kind === "scale") {
    return (
      scalePatterns.find((choice) => choice.direction === pattern.direction)
        ?.label ?? "Up and Down"
    );
  }

  if (pattern.kind === "interval-run") {
    return `In ${getExerciseIntervalRunLabel(pattern.interval)}`;
  }

  return getExerciseStackLabel(pattern.size);
}

function positionToBoundary(
  position: number,
  collectionSize: number,
): CollectionRangeBoundary {
  const octave = Math.floor(position / collectionSize);
  return {
    octave,
    stepOffset: position - octave * collectionSize,
  };
}

export function ExerciseLooperOptionsDialog({
  audioPresetId,
  collectionSize,
  end = DEFAULT_EXERCISE_END,
  isOpen,
  maxAnchorPosition,
  minAnchorPosition,
  onAudioPresetIdChange,
  onClone,
  onClose,
  onEndChange,
  onPatternChange,
  onRemove,
  onStartChange,
  onSubdivisionChange,
  onWoodChange,
  pattern,
  start = DEFAULT_EXERCISE_START,
  subdivision,
  supportsTertianExercises,
  wood,
}: {
  audioPresetId: AudioPresetId;
  collectionSize: number;
  end?: CollectionRangeBoundary;
  isOpen: boolean;
  maxAnchorPosition: number;
  minAnchorPosition: number;
  onAudioPresetIdChange: (value: AudioPresetId) => void;
  onClone?: () => void;
  onClose: () => void;
  onEndChange: (value: CollectionRangeBoundary) => void;
  onPatternChange: (value: ExercisePattern) => void;
  onRemove?: () => void;
  onStartChange: (value: CollectionRangeBoundary) => void;
  onSubdivisionChange: (value: ExerciseSubdivision) => void;
  onWoodChange: (value: WoodSurfaceId) => void;
  pattern: ExercisePattern;
  start?: CollectionRangeBoundary;
  subdivision: ExerciseSubdivision;
  supportsTertianExercises: boolean;
  wood: WoodSurfaceId;
}) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<MenuChoice>(null);
  const preset = audioPresets[audioPresetId];
  const firstPosition = Math.min(
    getCollectionPosition(start, collectionSize),
    getCollectionPosition(end, collectionSize),
  );
  const lastPosition = Math.max(
    getCollectionPosition(start, collectionSize),
    getCollectionPosition(end, collectionSize),
  );

  return (
    <ObjectMenuDialog
      isOpen={isOpen}
      title="Exercise Looper Options"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Pattern. Current: ${patternLabel(pattern)}`}
          icon={<ListMusic />}
          isOpen={isChoiceOpen("pattern")}
          label="Pattern"
          preview={patternLabel(pattern)}
          panelVariant="menu"
          onToggle={() => toggleChoice("pattern")}
        >
          <DisclosureList density="compact">
            {scalePatterns.map(({ label, ...choice }) => (
              <DisclosureListChoice
                key={choice.direction}
                label={label}
                selected={exercisePatternsAreEqual(pattern, choice)}
                onClick={() => onPatternChange(choice)}
              />
            ))}
            {supportsTertianExercises
              ? Array.from({ length: 12 }, (_, index) => index + 2).map(
                  (interval) => {
                    const choice = {
                      interval,
                      kind: "interval-run",
                    } as const;
                    return (
                      <DisclosureListChoice
                        key={`interval-${interval}`}
                        label={`In ${getExerciseIntervalRunLabel(interval)}`}
                        selected={exercisePatternsAreEqual(pattern, choice)}
                        onClick={() => onPatternChange(choice)}
                      />
                    );
                  },
                )
              : null}
            {supportsTertianExercises
              ? Array.from({ length: 6 }, (_, index) => index + 2).map(
                  (size) => {
                    const choice = {
                      kind: "diatonic-stack",
                      size,
                    } as const;
                    return (
                      <DisclosureListChoice
                        key={`stack-${size}`}
                        label={getExerciseStackLabel(size)}
                        selected={exercisePatternsAreEqual(pattern, choice)}
                        onClick={() => onPatternChange(choice)}
                      />
                    );
                  },
                )
              : null}
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel="Note division"
          icon={<Gauge />}
          isOpen={isChoiceOpen("subdivision")}
          label="Note Division"
          preview={
            subdivisions.find((choice) => choice.id === subdivision)?.label
          }
          panelVariant="menu"
          onToggle={() => toggleChoice("subdivision")}
        >
          <DisclosureList density="compact">
            {subdivisions.map((choice) => (
              <DisclosureListChoice
                key={choice.id}
                label={choice.label}
                selected={choice.id === subdivision}
                onClick={() => onSubdivisionChange(choice.id)}
              />
            ))}
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel="Pitch range"
          icon={<Ruler />}
          isOpen={isChoiceOpen("range")}
          label="Pitch Range"
          preview={`${firstPosition + 1}–${lastPosition + 1}`}
          panelVariant="menu"
          onToggle={() => toggleChoice("range")}
        >
          <BoundedRangeSliderGroup
            endLabel="End note"
            max={maxAnchorPosition}
            min={minAnchorPosition}
            minSpan={1}
            startLabel="Start note"
            value={[firstPosition, lastPosition]}
            valueFormatter={(value) => `Collection step ${value + 1}`}
            onChange={([nextStart, nextEnd]) => {
              onStartChange(positionToBoundary(nextStart, collectionSize));
              onEndChange(positionToBoundary(nextEnd, collectionSize));
            }}
          />
        </DisclosureListItem>

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
              void musoAudioEngine.playNote({
                midiNote: 60,
                presetId: nextPresetId,
                use: "exercise",
              });
            }}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Wood. Current: ${woodSurfaces[wood].title}`}
          icon={<PanelsTopLeft />}
          isOpen={isChoiceOpen("wood")}
          label="Wood"
          preview={<WoodSurfaceSwatch surfaceId={wood} />}
          subtitle={woodSurfaces[wood].title}
          panelVariant="menu"
          onToggle={() => toggleChoice("wood")}
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
