"use client";

import { AudioWaveform, PanelsTopLeft, Ruler } from "lucide-react";
import { audioPresets, musoAudioEngine, type AudioPresetId } from "@/audio";
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
import { BoundedRangeSliderGroup } from "@/components/ui/range-slider/BoundedRangeSliderGroup";
import { woodSurfaces, type WoodSurfaceId } from "@/data/woodSurfaces";
import {
  DEFAULT_EXERCISE_END,
  DEFAULT_EXERCISE_START,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  getCollectionPosition,
  getCollectionRangeBoundary,
  type CollectionRangeBoundary,
} from "@/utils/exercise-looper/exerciseSequence";

type MenuChoice = "range" | "sound" | "wood";

export function ExerciseLooperOptionsDialog({
  audioPresetId,
  collectionSize,
  end = DEFAULT_EXERCISE_END,
  isFiniteVoicing = false,
  isOpen,
  maxAnchorPosition,
  minAnchorPosition,
  onAudioPresetIdChange,
  onClone,
  onClose,
  onRangeChange,
  onRemove,
  onWoodChange,
  start = DEFAULT_EXERCISE_START,
  wood,
}: {
  audioPresetId: AudioPresetId;
  collectionSize: number;
  end?: CollectionRangeBoundary;
  isFiniteVoicing?: boolean;
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
  onWoodChange: (value: WoodSurfaceId) => void;
  start?: CollectionRangeBoundary;
  wood: WoodSurfaceId;
}) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<MenuChoice>(null);
  const preset = audioPresets[audioPresetId];
  const firstPosition = Math.min(
    getCollectionPosition(start, collectionSize, isFiniteVoicing),
    getCollectionPosition(end, collectionSize, isFiniteVoicing),
  );
  const lastPosition = Math.max(
    getCollectionPosition(start, collectionSize, isFiniteVoicing),
    getCollectionPosition(end, collectionSize, isFiniteVoicing),
  );

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Looper Options" onClose={onClose}>
      <DisclosureListGroup>
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
                getCollectionRangeBoundary(
                  nextStart,
                  collectionSize,
                  isFiniteVoicing,
                ),
                getCollectionRangeBoundary(
                  nextEnd,
                  collectionSize,
                  isFiniteVoicing,
                ),
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
