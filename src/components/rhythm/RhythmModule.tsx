"use client";

import { type ReactNode, useState } from "react";
import {
  Gauge,
  Minus,
  Music,
  Music3,
  Music4,
  Play,
  Plus,
  Square,
} from "lucide-react";
import { InstrumentIdentity } from "@/components/instrument/InstrumentIdentity";
import { PartModuleControlButton } from "@/components/part-module/PartModuleControlButton";
import controlStyles from "@/components/part-module/PartModuleControls.module.css";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { PartModuleHeaderActions } from "@/components/part-module/PartModuleHeaderActions";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import { useRhythmPlayback } from "@/hooks/audio/useRhythmPlayback";
import {
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
  getRhythmBeatCountLabel,
} from "@/data/rhythmPresets";
import {
  getRhythmSelectionLabel,
  getRhythmSelectionRecipe,
  getRhythmTimekeeperOptionLabel,
  type RhythmRecipe,
  type RhythmSelection,
  type RhythmTimekeeperFeel,
  type RhythmTimekeeperSound,
  type RhythmTimekeeperSubdivision,
} from "@/utils/rhythm/rhythmConfig";
import { RhythmOptionsDialog } from "./RhythmOptionsDialog";
import styles from "./RhythmModule.module.css";

const timekeeperSoundChoices = [
  {
    icon: (
      <span aria-hidden="true" className={styles.soundButtonLabel}>
        Off
      </span>
    ),
    label: "Turn timekeeper off",
    sound: "off",
  },
  {
    icon: (
      <span aria-hidden="true" className={styles.soundButtonLabel}>
        Hat
      </span>
    ),
    label: "Use closed hi-hat timekeeper",
    sound: "hat",
  },
  {
    icon: (
      <span aria-hidden="true" className={styles.soundButtonLabel}>
        Ride
      </span>
    ),
    label: "Use ride cymbal timekeeper",
    sound: "ride",
  },
  {
    icon: (
      <span aria-hidden="true" className={styles.soundButtonLabel}>
        Shk
      </span>
    ),
    label: "Use shaker timekeeper",
    sound: "shaker",
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  sound: RhythmTimekeeperSound;
}[];

const timekeeperSubdivisionChoices = [
  {
    icon: <Music3 />,
    label: "Quarter-note timekeeper",
    subdivision: "quarter",
  },
  {
    icon: <Music />,
    label: "Eighth-note timekeeper",
    subdivision: "eighth",
  },
  {
    icon: <Music4 />,
    label: "Sixteenth-note timekeeper",
    subdivision: "sixteenth",
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  subdivision: RhythmTimekeeperSubdivision;
}[];

function clampBeatCount(beats: number) {
  return Math.min(RHYTHM_MAX_BEATS, Math.max(RHYTHM_MIN_BEATS, beats));
}

function getRecipeWithBeatCount(recipe: RhythmRecipe, beats: number) {
  return {
    ...recipe,
    beats: clampBeatCount(beats),
  };
}

function getRecipeWithTimekeeper(
  recipe: RhythmRecipe,
  patch: Partial<{
    feel: RhythmTimekeeperFeel;
    sound: RhythmTimekeeperSound;
    subdivision: RhythmTimekeeperSubdivision;
  }>,
): RhythmRecipe {
  const timekeeper = {
    ...recipe.timekeeper,
    ...patch,
  };

  return {
    ...recipe,
    timekeeper: {
      ...timekeeper,
      feel:
        timekeeper.subdivision === "quarter" && timekeeper.feel !== "straight"
          ? "straight"
          : timekeeper.feel,
    },
  };
}

function getTimekeeperRhythmReadout(recipe: RhythmRecipe) {
  const subdivisionLabel = getRhythmTimekeeperOptionLabel(
    "subdivision",
    recipe.timekeeper,
  );

  if (recipe.timekeeper.feel === "straight") {
    return subdivisionLabel;
  }

  return `${getRhythmTimekeeperOptionLabel("feel", recipe.timekeeper)} ${subdivisionLabel}`;
}

export function RhythmModule({
  moduleId,
  onClone,
  onOpenSessionTempo,
  onRemove,
  onRhythmRecipeChange,
  rhythm,
  showHeader = true,
  tempoBpm = 80,
}: {
  moduleId: string;
  onClone?: () => void;
  onOpenSessionTempo?: () => void;
  onRemove?: () => void;
  onRhythmRecipeChange?: (value: RhythmRecipe) => void;
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
  const recipe = getRhythmSelectionRecipe(rhythm);
  const rhythmLabel = getRhythmSelectionLabel(rhythm);
  const beatCountLabel = getRhythmBeatCountLabel(recipe.beats);
  const timekeeperSoundLabel = getRhythmTimekeeperOptionLabel(
    "sound",
    recipe.timekeeper,
  );
  const timekeeperRhythmLabel = getTimekeeperRhythmReadout(recipe);
  const canDecreaseBeats = recipe.beats > RHYTHM_MIN_BEATS;
  const canIncreaseBeats = recipe.beats < RHYTHM_MAX_BEATS;
  const timekeeperModifierUnavailable =
    !onRhythmRecipeChange || recipe.timekeeper.subdivision === "quarter";

  const setBeats = (beats: number) => {
    onRhythmRecipeChange?.(getRecipeWithBeatCount(recipe, beats));
  };

  const updateTimekeeper = (
    patch: Parameters<typeof getRecipeWithTimekeeper>[1],
  ) => {
    onRhythmRecipeChange?.(getRecipeWithTimekeeper(recipe, patch));
  };

  const toggleTimekeeperFeel = (
    feel: Exclude<RhythmTimekeeperFeel, "straight">,
  ) => {
    if (recipe.timekeeper.subdivision === "quarter") {
      return;
    }

    updateTimekeeper({
      feel: recipe.timekeeper.feel === feel ? "straight" : feel,
    });
  };

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
            <div
              aria-label="Playback and tempo"
              className={controlStyles.groupRow}
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

            <output
              aria-label={`Current rhythm: ${rhythmLabel}`}
              className={styles.recipeSummary}
            >
              {rhythmLabel}
            </output>

            <div
              aria-label="Rhythm length"
              className={controlStyles.groupRow}
              role="group"
            >
              <TactileControlGroup
                aria-label="Loop length"
                className={controlStyles.controlGroup}
                controlsClassName={controlStyles.buttonGroup}
                readout={beatCountLabel}
                readoutAriaLabel={`Loop length: ${beatCountLabel}`}
                readoutClassName={styles.recipeReadout}
              >
                <PartModuleControlButton
                  aria-label={`Remove one beat. Current loop length: ${beatCountLabel}`}
                  icon={<Minus />}
                  onPress={() => setBeats(recipe.beats - 1)}
                  unavailable={!onRhythmRecipeChange || !canDecreaseBeats}
                />
                <PartModuleControlButton
                  aria-label={`Add one beat. Current loop length: ${beatCountLabel}`}
                  icon={<Plus />}
                  onPress={() => setBeats(recipe.beats + 1)}
                  unavailable={!onRhythmRecipeChange || !canIncreaseBeats}
                />
              </TactileControlGroup>
            </div>

            <div
              aria-label="Timekeeper lane"
              className={controlStyles.groupRow}
              role="group"
            >
              <TactileControlGroup
                aria-label="Timekeeper sound"
                className={controlStyles.controlGroup}
                controlsClassName={controlStyles.buttonGroup}
                readout={timekeeperSoundLabel}
                readoutAriaLabel={`Timekeeper sound: ${timekeeperSoundLabel}`}
                readoutClassName={styles.recipeReadout}
              >
                {timekeeperSoundChoices.map((choice) => (
                  <PartModuleControlButton
                    key={choice.sound}
                    aria-label={choice.label}
                    icon={choice.icon}
                    onPress={() => updateTimekeeper({ sound: choice.sound })}
                    selected={recipe.timekeeper.sound === choice.sound}
                    unavailable={!onRhythmRecipeChange}
                  />
                ))}
              </TactileControlGroup>

              <TactileControlGroup
                aria-label="Timekeeper rhythm"
                className={controlStyles.controlGroup}
                controlsClassName={controlStyles.modifierButtonGroup}
                readout={timekeeperRhythmLabel}
                readoutAriaLabel={`Timekeeper rhythm: ${timekeeperRhythmLabel}`}
                readoutClassName={styles.recipeReadout}
              >
                <span
                  aria-label="Timekeeper note value"
                  className={controlStyles.buttonGroup}
                  role="group"
                >
                  {timekeeperSubdivisionChoices.map((choice) => (
                    <PartModuleControlButton
                      key={choice.subdivision}
                      aria-label={choice.label}
                      icon={choice.icon}
                      onPress={() =>
                        updateTimekeeper({
                          subdivision: choice.subdivision,
                        })
                      }
                      selected={
                        recipe.timekeeper.subdivision === choice.subdivision
                      }
                      unavailable={!onRhythmRecipeChange}
                    />
                  ))}
                </span>

                <PartModuleControlButton
                  aria-label={
                    recipe.timekeeper.feel === "triplet"
                      ? "Use straight timekeeper notes"
                      : "Use triplet timekeeper notes"
                  }
                  icon={
                    <span
                      aria-hidden="true"
                      className={styles.tripletButtonLabel}
                    >
                      3
                    </span>
                  }
                  onPress={() => toggleTimekeeperFeel("triplet")}
                  selected={recipe.timekeeper.feel === "triplet"}
                  unavailable={timekeeperModifierUnavailable}
                />

                <PartModuleControlButton
                  aria-label={
                    recipe.timekeeper.feel === "swing"
                      ? "Use straight timekeeper notes"
                      : "Use swung timekeeper notes"
                  }
                  icon={
                    <span
                      aria-hidden="true"
                      className={styles.swingButtonLabel}
                    >
                      Sw
                    </span>
                  }
                  onPress={() => toggleTimekeeperFeel("swing")}
                  selected={recipe.timekeeper.feel === "swing"}
                  unavailable={timekeeperModifierUnavailable}
                />
              </TactileControlGroup>
            </div>
          </div>
        </div>
      </PartModuleFrame>

      {showHeader ? (
        <RhythmOptionsDialog
          isOpen={isOptionsOpen}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onRemove={onRemove}
        />
      ) : null}
    </>
  );
}
