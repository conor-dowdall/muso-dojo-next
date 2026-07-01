"use client";

import { WoodSurfaceCreationPanel } from "@/components/part-module-creation/WoodSurfaceCreationPanel";
import { type RhythmModuleCreationDefault } from "@/types/instrument-creation-defaults";

interface RhythmCreationPanelProps {
  ariaLabel?: string;
  closeSignal?: number;
  onChange: (value: RhythmModuleCreationDefault) => void;
  value: RhythmModuleCreationDefault;
}

export function RhythmCreationPanel({
  ariaLabel = "Rhythm settings",
  closeSignal,
  onChange,
  value,
}: RhythmCreationPanelProps) {
  return (
    <WoodSurfaceCreationPanel
      ariaLabel={ariaLabel}
      closeSignal={closeSignal}
      value={value}
      onChange={onChange}
    />
  );
}
