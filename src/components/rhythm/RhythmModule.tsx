"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { Gauge, Minus, Play, Plus, Square } from "lucide-react";
import { InstrumentIdentity } from "@/components/instrument/InstrumentIdentity";
import { PartModuleControlButton } from "@/components/part-module/PartModuleControlButton";
import controlStyles from "@/components/part-module/PartModuleControls.module.css";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { PartModuleHeaderActions } from "@/components/part-module/PartModuleHeaderActions";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import { useRhythmPlayback } from "@/hooks/audio/useRhythmPlayback";
import {
  getRhythmGroupingOptionLabel,
  getRhythmGroupingOptions,
  getRhythmGroupingReadout,
  getRhythmGrooveOptionLabel,
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
} from "@/data/rhythmPresets";
import { woodSurfaces } from "@/data/woodSurfaces";
import {
  getRhythmSelectionRecipe,
  getRhythmTimekeeperOptionLabel,
  type RhythmGroove,
  type RhythmGrouping,
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

const grooveChoices = [
  {
    groove: "off",
    label: "Turn kick and snare foundation off",
    text: "Off",
  },
  {
    groove: "kick",
    label: "Use bass drum on every beat",
    text: "Kick",
  },
  {
    groove: "backbeat",
    label: "Use simple kick and snare backbeat",
    text: "Back",
  },
  {
    groove: "sparse",
    label: "Use light kick and snare outline",
    text: "Light",
  },
] as const satisfies readonly {
  groove: RhythmGroove;
  label: string;
  text: string;
}[];

const timekeeperSubdivisionChoices = [
  {
    count: 1,
    feel: "straight",
    label: "Use one subdivision per beat",
    subdivision: "quarter",
  },
  {
    count: 2,
    feel: "straight",
    label: "Use two subdivisions per beat",
    subdivision: "eighth",
  },
  {
    count: 3,
    feel: "triplet",
    label: "Use three subdivisions per beat",
    subdivision: "eighth",
  },
  {
    count: 4,
    feel: "straight",
    label: "Use four subdivisions per beat",
    subdivision: "sixteenth",
  },
] as const satisfies readonly {
  count: number;
  feel: RhythmTimekeeperFeel;
  label: string;
  subdivision: RhythmTimekeeperSubdivision;
}[];

function clampBeatCount(beats: number) {
  return Math.min(RHYTHM_MAX_BEATS, Math.max(RHYTHM_MIN_BEATS, beats));
}

function getRecipeWithBeatCount(recipe: RhythmRecipe, beats: number) {
  const nextBeats = clampBeatCount(beats);

  return {
    ...recipe,
    beats: nextBeats,
    grouping: getRhythmGroupingOptions(nextBeats).includes(recipe.grouping)
      ? recipe.grouping
      : "auto",
  };
}

function getRecipeWithGrouping(
  recipe: RhythmRecipe,
  grouping: RhythmGrouping,
): RhythmRecipe {
  return {
    ...recipe,
    grouping,
  };
}

function getRecipeWithGroove(
  recipe: RhythmRecipe,
  groove: RhythmGroove,
): RhythmRecipe {
  return {
    ...recipe,
    groove,
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
  const subdivision =
    timekeeper.feel === "triplet" || timekeeper.feel === "swing"
      ? "eighth"
      : timekeeper.subdivision;

  return {
    ...recipe,
    timekeeper: {
      ...timekeeper,
      subdivision,
    },
  };
}

function getTimekeeperRhythmReadout(recipe: RhythmRecipe) {
  if (recipe.timekeeper.feel === "swing") {
    return "Swing";
  }

  const subdivisionChoice = timekeeperSubdivisionChoices.find(
    (choice) =>
      choice.feel === recipe.timekeeper.feel &&
      choice.subdivision === recipe.timekeeper.subdivision,
  );

  return `${subdivisionChoice?.count ?? 2} / Beat`;
}

function getBeatControlLabel(beats: number) {
  return `${beats} ${beats === 1 ? "Beat" : "Beats"}`;
}

function getGroupingControlLabel(grouping: RhythmGrouping) {
  if (grouping === "auto") {
    return "Use default beat grouping";
  }

  return `Group beats as ${getRhythmGroupingOptionLabel(grouping)}`;
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
  const beatCountLabel = getBeatControlLabel(recipe.beats);
  const grooveLabel = getRhythmGrooveOptionLabel(recipe.groove);
  const groupingChoices = getRhythmGroupingOptions(recipe.beats);
  const groupingReadout = getRhythmGroupingReadout(recipe);
  const timekeeperSoundLabel = getRhythmTimekeeperOptionLabel(
    "sound",
    recipe.timekeeper,
  );
  const timekeeperRhythmLabel = getTimekeeperRhythmReadout(recipe);
  const canDecreaseBeats = recipe.beats > RHYTHM_MIN_BEATS;
  const canIncreaseBeats = recipe.beats < RHYTHM_MAX_BEATS;
  const rhythmFrameStyle = {
    "--part-module-body-background": woodSurfaces.rosewood.background,
  } as CSSProperties;

  const setBeats = (beats: number) => {
    onRhythmRecipeChange?.(getRecipeWithBeatCount(recipe, beats));
  };

  const setGrouping = (grouping: RhythmGrouping) => {
    onRhythmRecipeChange?.(getRecipeWithGrouping(recipe, grouping));
  };

  const setGroove = (groove: RhythmGroove) => {
    onRhythmRecipeChange?.(getRecipeWithGroove(recipe, groove));
  };

  const updateTimekeeper = (
    patch: Parameters<typeof getRecipeWithTimekeeper>[1],
  ) => {
    onRhythmRecipeChange?.(getRecipeWithTimekeeper(recipe, patch));
  };

  const toggleSwingTimekeeper = () => {
    updateTimekeeper({
      feel: recipe.timekeeper.feel === "swing" ? "straight" : "swing",
      subdivision: "eighth",
    });
  };

  return (
    <>
      <PartModuleFrame
        bodyClassName={controlStyles.body}
        className={`${styles.frame} ${controlStyles.surface}`}
        headerPrimary={<InstrumentIdentity label="Rhythm" />}
        showHeader={showHeader}
        style={rhythmFrameStyle}
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

            <div
              aria-label="Rhythm beats"
              className={controlStyles.groupRow}
              role="group"
            >
              <TactileControlGroup
                aria-label="Loop beats"
                className={controlStyles.controlGroup}
                controlsClassName={controlStyles.buttonGroup}
                readout={beatCountLabel}
                readoutAriaLabel={`Loop beats: ${beatCountLabel}`}
                readoutClassName={styles.recipeReadout}
              >
                <PartModuleControlButton
                  aria-label={`Remove one beat. Current loop: ${beatCountLabel}`}
                  icon={<Minus />}
                  onPress={() => setBeats(recipe.beats - 1)}
                  unavailable={!onRhythmRecipeChange || !canDecreaseBeats}
                />
                <PartModuleControlButton
                  aria-label={`Add one beat. Current loop: ${beatCountLabel}`}
                  icon={<Plus />}
                  onPress={() => setBeats(recipe.beats + 1)}
                  unavailable={!onRhythmRecipeChange || !canIncreaseBeats}
                />
              </TactileControlGroup>

              {groupingChoices.length > 1 ? (
                <TactileControlGroup
                  aria-label="Beat grouping"
                  className={controlStyles.controlGroup}
                  controlsClassName={controlStyles.buttonGroup}
                  readout={groupingReadout}
                  readoutAriaLabel={`Beat grouping: ${groupingReadout}`}
                  readoutClassName={styles.recipeReadout}
                >
                  {groupingChoices.map((grouping) => (
                    <PartModuleControlButton
                      key={grouping}
                      aria-label={getGroupingControlLabel(grouping)}
                      icon={
                        <span
                          aria-hidden="true"
                          className={styles.soundButtonLabel}
                        >
                          {getRhythmGroupingOptionLabel(grouping)}
                        </span>
                      }
                      onPress={() => setGrouping(grouping)}
                      selected={recipe.grouping === grouping}
                      unavailable={!onRhythmRecipeChange}
                    />
                  ))}
                </TactileControlGroup>
              ) : null}
            </div>

            <div
              aria-label="Groove and timekeeper"
              className={controlStyles.groupRow}
              role="group"
            >
              <TactileControlGroup
                aria-label="Groove foundation"
                className={controlStyles.controlGroup}
                controlsClassName={controlStyles.buttonGroup}
                readout={grooveLabel}
                readoutAriaLabel={`Groove foundation: ${grooveLabel}`}
                readoutClassName={styles.recipeReadout}
              >
                {grooveChoices.map((choice) => (
                  <PartModuleControlButton
                    key={choice.groove}
                    aria-label={choice.label}
                    icon={
                      <span
                        aria-hidden="true"
                        className={styles.soundButtonLabel}
                      >
                        {choice.text}
                      </span>
                    }
                    onPress={() => setGroove(choice.groove)}
                    selected={recipe.groove === choice.groove}
                    unavailable={!onRhythmRecipeChange}
                  />
                ))}
              </TactileControlGroup>

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
                  aria-label="Timekeeper subdivisions"
                  className={controlStyles.buttonGroup}
                  role="group"
                >
                  {timekeeperSubdivisionChoices.map((choice) => (
                    <PartModuleControlButton
                      key={`${choice.subdivision}-${choice.feel}`}
                      aria-label={choice.label}
                      icon={
                        <span
                          aria-hidden="true"
                          className={styles.subdivisionButtonLabel}
                        >
                          {choice.count}
                        </span>
                      }
                      onPress={() =>
                        updateTimekeeper({
                          feel: choice.feel,
                          subdivision: choice.subdivision,
                        })
                      }
                      selected={
                        recipe.timekeeper.feel === choice.feel &&
                        recipe.timekeeper.subdivision === choice.subdivision
                      }
                      unavailable={!onRhythmRecipeChange}
                    />
                  ))}
                </span>

                <PartModuleControlButton
                  aria-label={
                    recipe.timekeeper.feel === "swing"
                      ? "Use straight two-subdivision feel"
                      : "Use swung two-subdivision feel"
                  }
                  icon={
                    <span
                      aria-hidden="true"
                      className={styles.swingButtonLabel}
                    >
                      Sw
                    </span>
                  }
                  onPress={toggleSwingTimekeeper}
                  selected={recipe.timekeeper.feel === "swing"}
                  unavailable={!onRhythmRecipeChange}
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
