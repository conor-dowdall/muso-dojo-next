"use client";

import { useEffect } from "react";
import { WoodSurfaceDisclosureItem } from "@/components/appearance/WoodSurfaceChoiceList";
import { OctaveOffsetStepper } from "@/components/part-module/OctaveOffsetStepper";
import {
  DisclosureList,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  DEFAULT_WOOD_SURFACE_ID,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import { type ExerciseLooperModuleCreationDefault } from "@/types/instrument-creation-defaults";
import {
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import { getExerciseBaseOctave } from "@/utils/exercise-looper/exerciseSequence";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

type ExerciseLooperCreationChoice = "octave" | "wood";

interface ExerciseLooperCreationPanelProps {
  ariaLabel?: string;
  closeSignal?: number;
  onChange: (value: ExerciseLooperModuleCreationDefault) => void;
  value: ExerciseLooperModuleCreationDefault;
}

function formatExerciseOctave(octaveOffset: number) {
  return `Octave ${getExerciseBaseOctave(octaveOffset)}`;
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
        <DisclosureListItem
          ariaLabel={`Choose octave, ${formatExerciseOctave(octaveOffset)} selected`}
          isOpen={openChoice === "octave"}
          keepMounted
          label="Octave"
          preview={formatExerciseOctave(octaveOffset)}
          onToggle={() => toggleChoice("octave")}
        >
          <OctaveOffsetStepper
            aria-label="Looper octave"
            formatValue={formatExerciseOctave}
            max={EXERCISE_MAX_OCTAVE_OFFSET}
            min={EXERCISE_MIN_OCTAVE_OFFSET}
            value={octaveOffset}
            onChange={handleOctaveOffsetChange}
          />
        </DisclosureListItem>

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
