"use client";

import { useEffect } from "react";
import { WoodSurfaceChoiceList } from "@/components/appearance/WoodSurfaceChoiceList";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
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
import { type DroneModuleCreationDefault } from "@/types/instrument-creation-defaults";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

interface DroneCreationPanelProps {
  ariaLabel?: string;
  closeSignal?: number;
  onChange: (value: DroneModuleCreationDefault) => void;
  value: DroneModuleCreationDefault;
}

export function DroneCreationPanel({
  ariaLabel = "Drone settings",
  closeSignal,
  onChange,
  value,
}: DroneCreationPanelProps) {
  const { closeAll, openChoice, toggleChoice } = useDisclosureList<"wood">();
  const wood = value.wood ?? DEFAULT_WOOD_SURFACE_ID;

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  const handleWoodChange = (nextWood: WoodSurfaceId) => {
    onChange({ wood: nextWood });
  };

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      <DisclosureList>
        <DisclosureListItem
          ariaLabel={`Choose wood, ${woodSurfaces[wood].title} selected`}
          isOpen={openChoice === "wood"}
          keepMounted
          label="Wood"
          preview={<WoodSurfaceSwatch surfaceId={wood} />}
          subtitle={woodSurfaces[wood].title}
          onToggle={() => toggleChoice("wood")}
        >
          <WoodSurfaceChoiceList value={wood} onChange={handleWoodChange} />
        </DisclosureListItem>
      </DisclosureList>
    </section>
  );
}
