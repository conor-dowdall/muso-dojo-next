"use client";

import type { FretboardConfig } from "@/types/fretboard";
import { getNoteNamesFromRootAndCollectionKey } from "@musodojo/music-theory-data";
import { useFretboardConfig } from "@/hooks/useFretboardConfig";
import type { FretboardPresetName } from "@/configs/fretboards/index";

export interface FretboardProps extends Partial<FretboardConfig> {
  config?: Partial<FretboardConfig>;
  preset?: FretboardPresetName;
}

export function Fretboard({ config = {}, preset, ...rest }: FretboardProps) {
  const cfg = useFretboardConfig(preset, { ...config, ...rest });

  return (
    <p>
      {getNoteNamesFromRootAndCollectionKey(
        cfg.rootNote ?? "C",
        cfg.noteCollectionKey ?? "ionian",
      )}
    </p>
  );
}
