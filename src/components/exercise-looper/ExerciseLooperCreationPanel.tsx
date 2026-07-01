"use client";

import { useEffect } from "react";
import { SwatchBook, WavesArrowUp } from "lucide-react";
import { WoodSurfaceChoiceList } from "@/components/appearance/WoodSurfaceChoiceList";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import { OctaveOffsetStepper } from "@/components/part-module/OctaveOffsetStepper";
import {
  DisclosureList,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  DEFAULT_WOOD_SURFACE_ID,
  woodSurfaces,
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

type ExerciseLooperCreationChoice = "octave" | "appearance";

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
          icon={<WavesArrowUp />}
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

        <DisclosureListItem
          ariaLabel={`Choose appearance, ${woodSurfaces[wood].title} selected`}
          icon={<SwatchBook />}
          isOpen={openChoice === "appearance"}
          keepMounted
          label="Appearance"
          preview={<WoodSurfaceSwatch surfaceId={wood} />}
          onToggle={() => toggleChoice("appearance")}
        >
          <WoodSurfaceChoiceList value={wood} onChange={handleWoodChange} />
        </DisclosureListItem>
      </DisclosureList>
    </section>
  );
}
