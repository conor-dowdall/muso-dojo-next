"use client";

import { useState } from "react";
import { Drum, Gauge, Play, Square } from "lucide-react";
import { InstrumentIdentity } from "@/components/instrument/InstrumentIdentity";
import { PartModuleControlButton } from "@/components/part-module/PartModuleControlButton";
import controlStyles from "@/components/part-module/PartModuleControls.module.css";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { PartModuleHeaderActions } from "@/components/part-module/PartModuleHeaderActions";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import { useRhythmPlayback } from "@/hooks/audio/useRhythmPlayback";
import {
  getRhythmSelectionLabel,
  type RhythmPresetId,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import { RhythmOptionsDialog } from "./RhythmOptionsDialog";
import styles from "./RhythmModule.module.css";

export function RhythmModule({
  moduleId,
  onClone,
  onOpenSessionTempo,
  onRemove,
  onRhythmPresetIdChange,
  rhythm,
  showHeader = true,
  tempoBpm = 80,
}: {
  moduleId: string;
  onClone?: () => void;
  onOpenSessionTempo?: () => void;
  onRemove?: () => void;
  onRhythmPresetIdChange?: (value: RhythmPresetId) => void;
  rhythm: RhythmSelection;
  showHeader?: boolean;
  tempoBpm?: number;
}) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const playback = useRhythmPlayback({
    id: moduleId,
    rhythm,
    tempoBpm,
  });
  const rhythmLabel = getRhythmSelectionLabel(rhythm);

  return (
    <>
      <PartModuleFrame
        bodyClassName={controlStyles.body}
        className={`${styles.frame} ${controlStyles.surface}`}
        headerPrimary={<InstrumentIdentity label="Rhythm" />}
        showHeader={showHeader}
        headerActions={
          showHeader ? (
            <PartModuleHeaderActions
              utility={
                <OverflowMenuButton
                  aria-label="Rhythm options"
                  onClick={() => setIsOptionsOpen(true)}
                />
              }
            />
          ) : undefined
        }
      >
        <div className={`${styles.content} ${controlStyles.content}`}>
          <div
            aria-label="Rhythm controls"
            className={styles.controlDeck}
            role="group"
          >
            <TactileControlGroup
              aria-label="Rhythm playback"
              className={controlStyles.controlGroup}
            >
              <PartModuleControlButton
                aria-label={playback.isActive ? "Stop rhythm" : "Play rhythm"}
                icon={playback.isActive ? <Square /> : <Play />}
                onPress={playback.isActive ? playback.stop : playback.start}
                prominence="primary"
                selected={playback.isActive}
              />
            </TactileControlGroup>

            <TactileControlGroup
              aria-label="Rhythm preset"
              className={controlStyles.controlGroup}
              readout={rhythmLabel}
              readoutAriaLabel={`Rhythm: ${rhythmLabel}`}
              readoutClassName={styles.rhythmReadout}
            >
              <PartModuleControlButton
                aria-label={`Choose rhythm. Current rhythm: ${rhythmLabel}`}
                icon={<Drum />}
                onPress={() => setIsOptionsOpen(true)}
                selected={false}
                unavailable={!onRhythmPresetIdChange}
              />
            </TactileControlGroup>

            <TactileControlGroup
              aria-label="Session tempo"
              className={controlStyles.controlGroup}
              readout={tempoBpm}
              readoutAriaLabel={`Session tempo: ${tempoBpm} bpm`}
            >
              <PartModuleControlButton
                activationEvent="click"
                aria-label={`Set session tempo. Current tempo: ${tempoBpm} bpm`}
                icon={<Gauge />}
                onPress={() => onOpenSessionTempo?.()}
                unavailable={!onOpenSessionTempo}
              />
            </TactileControlGroup>
          </div>
        </div>
      </PartModuleFrame>

      {showHeader ? (
        <RhythmOptionsDialog
          isOpen={isOptionsOpen}
          rhythm={rhythm}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onRemove={onRemove}
          onRhythmPresetIdChange={onRhythmPresetIdChange}
        />
      ) : null}
    </>
  );
}
