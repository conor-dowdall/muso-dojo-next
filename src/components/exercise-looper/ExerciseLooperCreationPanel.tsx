"use client";

import { useEffect } from "react";
import { WoodSurfaceDisclosureItem } from "@/components/appearance/WoodSurfaceChoiceList";
import {
  DisclosureList,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  DEFAULT_WOOD_SURFACE_ID,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import { type ExerciseLooperModuleCreationDefault } from "@/types/instrument-creation-defaults";
import { DEFAULT_EXERCISE_OCTAVE_OFFSET } from "@/utils/exercise-looper/exerciseConfig";
import { getDefaultAudioPresetId } from "@/audio";
import {
  ExerciseOctaveDisclosure,
  ExercisePlaybackSoundDisclosure,
} from "./ExerciseVoiceDisclosureItems";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

type ExerciseLooperCreationChoice = "octave" | "sound" | "wood";

interface ExerciseLooperCreationPanelProps {
  ariaLabel?: string;
  closeSignal?: number;
  onChange: (value: ExerciseLooperModuleCreationDefault) => void;
  value: ExerciseLooperModuleCreationDefault;
}

export function ExerciseLooperCreationPanel({
  ariaLabel = "Looper settings",
  closeSignal,
  onChange,
  value,
}: ExerciseLooperCreationPanelProps) {
  const { closeAll, openChoice, toggleChoice } =
    useDisclosureList<ExerciseLooperCreationChoice>();
  const octaveOffset = value.octaveOffset ?? DEFAULT_EXERCISE_OCTAVE_OFFSET;
  const audioPresetId =
    value.audioPresetId ?? getDefaultAudioPresetId("exercise");
  const wood = value.wood ?? DEFAULT_WOOD_SURFACE_ID;

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  const handleOctaveOffsetChange = (nextOctaveOffset: number) => {
    onChange({ ...value, octaveOffset: nextOctaveOffset });
  };

  const handleWoodChange = (nextWood: WoodSurfaceId) => {
    onChange({ ...value, wood: nextWood });
  };

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      <DisclosureList>
        <ExercisePlaybackSoundDisclosure
          audioPresetId={audioPresetId}
          isOpen={openChoice === "sound"}
          keepMounted
          showIcon={false}
          onChange={(nextAudioPresetId) =>
            onChange({ ...value, audioPresetId: nextAudioPresetId })
          }
          onToggle={() => toggleChoice("sound")}
        />

        <ExerciseOctaveDisclosure
          isOpen={openChoice === "octave"}
          keepMounted
          octaveOffset={octaveOffset}
          showIcon={false}
          onChange={handleOctaveOffsetChange}
          onToggle={() => toggleChoice("octave")}
        />

        <WoodSurfaceDisclosureItem
          isOpen={openChoice === "wood"}
          keepMounted
          surfaceId={wood}
          onChange={handleWoodChange}
          onToggle={() => toggleChoice("wood")}
        />
      </DisclosureList>
    </section>
  );
}
