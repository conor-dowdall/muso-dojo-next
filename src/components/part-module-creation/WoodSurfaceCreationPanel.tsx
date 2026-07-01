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
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

export interface WoodSurfaceCreationValue {
  wood?: WoodSurfaceId;
}

interface WoodSurfaceCreationPanelProps<
  TValue extends WoodSurfaceCreationValue,
> {
  ariaLabel: string;
  closeSignal?: number;
  onChange: (value: TValue) => void;
  value: TValue;
}

export function WoodSurfaceCreationPanel<
  TValue extends WoodSurfaceCreationValue,
>({
  ariaLabel,
  closeSignal,
  onChange,
  value,
}: WoodSurfaceCreationPanelProps<TValue>) {
  const { closeAll, openChoice, toggleChoice } =
    useDisclosureList<"appearance">();
  const wood = value.wood ?? DEFAULT_WOOD_SURFACE_ID;

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  const handleWoodChange = (nextWood: WoodSurfaceId) => {
    onChange({ ...value, wood: nextWood });
  };

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      <DisclosureList>
        <DisclosureListItem
          ariaLabel={`Choose appearance, ${woodSurfaces[wood].title} selected`}
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
