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
import { type DroneModuleCreationDefault } from "@/types/instrument-creation-defaults";
import {
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_OFFSET,
  getDroneBaseOctave,
} from "@/utils/drone/droneNotes";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

type DroneCreationChoice = "octave" | "wood";

interface DroneCreationPanelProps {
  ariaLabel?: string;
  closeSignal?: number;
  onChange: (value: DroneModuleCreationDefault) => void;
  value: DroneModuleCreationDefault;
}

function formatDroneOctave(octaveOffset: number) {
  return `Octave ${getDroneBaseOctave(octaveOffset)}`;
}

export function DroneCreationPanel({
  ariaLabel = "Drone settings",
  closeSignal,
  onChange,
  value,
}: DroneCreationPanelProps) {
  const { closeAll, openChoice, toggleChoice } =
    useDisclosureList<DroneCreationChoice>();
  const octaveOffset = value.octaveOffset ?? 0;
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
          ariaLabel={`Choose octave, ${formatDroneOctave(octaveOffset)} selected`}
          isOpen={openChoice === "octave"}
          keepMounted
          label="Octave"
          preview={formatDroneOctave(octaveOffset)}
          onToggle={() => toggleChoice("octave")}
        >
          <OctaveOffsetStepper
            aria-label="Drone octave"
            formatValue={formatDroneOctave}
            max={DRONE_MAX_OCTAVE_OFFSET}
            min={DRONE_MIN_OCTAVE_OFFSET}
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
