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
  const { closeAll, openChoice, toggleChoice } = useDisclosureList<"wood">();
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
