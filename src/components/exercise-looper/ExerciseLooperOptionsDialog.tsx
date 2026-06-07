"use client";

import { AudioWaveform, Gauge, PanelsTopLeft, Ruler } from "lucide-react";
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
  DEFAULT_EXERCISE_END,
  DEFAULT_EXERCISE_START,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  getCollectionPosition,
  getCollectionRangeBoundary,
  type CollectionRangeBoundary,
} from "@/utils/exercise-looper/exerciseSequence";

type MenuChoice = "subdivision" | "range" | "sound" | "wood";

const subdivisions = [
  { id: "quarter", label: "Quarter Notes" },
  { id: "eighth", label: "Eighth Notes" },
  { id: "eighth-triplet", label: "Eighth-Note Triplets" },
  { id: "sixteenth", label: "Sixteenth Notes" },
  { id: "sixteenth-triplet", label: "Sixteenth-Note Triplets" },
] as const satisfies readonly { id: ExerciseSubdivision; label: string }[];

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
  onRangeChange,
  onRemove,
  onSubdivisionChange,
  onWoodChange,
  start = DEFAULT_EXERCISE_START,
  subdivision,
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
  onRangeChange: (
    start: CollectionRangeBoundary,
    end: CollectionRangeBoundary,
  ) => void;
  onRemove?: () => void;
  onSubdivisionChange: (value: ExerciseSubdivision) => void;
  onWoodChange: (value: WoodSurfaceId) => void;
  start?: CollectionRangeBoundary;
  subdivision: ExerciseSubdivision;
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
            minSpan={0}
            startLabel="Start note"
            value={[firstPosition, lastPosition]}
            valueFormatter={(value) => `Collection step ${value + 1}`}
            onChange={([nextStart, nextEnd]) => {
              onRangeChange(
                getCollectionRangeBoundary(nextStart, collectionSize),
                getCollectionRangeBoundary(nextEnd, collectionSize),
              );
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
