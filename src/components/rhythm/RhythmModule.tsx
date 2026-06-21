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
  getRhythmGroupingChoiceLabel,
  getRhythmGroupingOptions,
  getRhythmGroupingReadout,
  getRhythmGrooveOptionLabel,
  getRhythmTemplateForRecipe,
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
  rhythmTemplateOptions,
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
    groove: "kick",
    label: "Use bass drum pulse on the counted beats",
    text: "Pulse",
  },
  {
    groove: "backbeat",
    label: "Use simple kick and snare backbeat",
    text: "Back",
  },
  {
    groove: "bluegrass",
    label: "Use bluegrass-style offbeat snare drive",
    text: "Drive",
  },
] as const satisfies readonly {
  groove: RhythmGroove;
  label: string;
  text: string;
}[];

const timekeeperSubdivisionChoices = [
  {
    label: "Turn timekeeper rhythm off",
    text: "0",
    feel: "off",
    subdivision: "eighth",
  },
  {
    label: "Use one subdivision per beat",
    text: "1",
    feel: "straight",
    subdivision: "quarter",
  },
  {
    label: "Use two subdivisions per beat",
    text: "2",
    feel: "straight",
    subdivision: "eighth",
  },
  {
    label: "Use three subdivisions per beat",
    text: "3",
    feel: "triplet",
    subdivision: "eighth",
  },
  {
    label: "Use four subdivisions per beat",
    text: "4",
    feel: "straight",
    subdivision: "sixteenth",
  },
  {
    label: "Use swung two-subdivision feel",
    text: "Sw",
    feel: "swing",
    subdivision: "eighth",
  },
] as const satisfies readonly {
  feel: RhythmTimekeeperFeel;
  label: string;
  subdivision: RhythmTimekeeperSubdivision;
  text: string;
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
  if (recipe.timekeeper.feel === "off") {
    return "0 / Beat";
  }

  if (recipe.timekeeper.feel === "swing") {
    return "Swing";
  }

  const subdivisionChoice = timekeeperSubdivisionChoices.find(
    (choice) =>
      choice.feel === recipe.timekeeper.feel &&
      choice.subdivision === recipe.timekeeper.subdivision,
  );

  return `${subdivisionChoice?.text ?? 2} / Beat`;
}

function getBeatControlLabel(beats: number) {
  return `${beats} ${beats === 1 ? "Beat" : "Beats"}`;
}

function getGroupingControlLabel(beats: number, grouping: RhythmGrouping) {
  return `Group beats as ${getRhythmGroupingChoiceLabel(beats, grouping)}`;
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
  const activeTemplate = getRhythmTemplateForRecipe(recipe);
  const timekeeperSoundLabel = getRhythmTimekeeperOptionLabel(
    "sound",
    recipe.timekeeper,
  );
  const timekeeperRhythmLabel = getTimekeeperRhythmReadout(recipe);
  const timekeeperLabel =
    recipe.timekeeper.feel === "off"
      ? "Off"
      : `${timekeeperSoundLabel} ${timekeeperRhythmLabel}`;
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

  const setTemplate = (templateRecipe: RhythmRecipe) => {
    onRhythmRecipeChange?.({
      ...templateRecipe,
      timekeeper: { ...templateRecipe.timekeeper },
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
              aria-label="Rhythm templates"
              className={controlStyles.groupRow}
              role="group"
            >
              <TactileControlGroup
                aria-label="Rhythm templates"
                className={controlStyles.controlGroup}
                controlsClassName={controlStyles.buttonGroup}
                readout={activeTemplate?.label ?? "Custom"}
                readoutAriaLabel={`Rhythm template: ${activeTemplate?.label ?? "Custom"}`}
                readoutClassName={styles.recipeReadout}
              >
                {rhythmTemplateOptions.map((template) => (
                  <PartModuleControlButton
                    key={template.id}
                    aria-label={`Use ${template.label} rhythm template`}
                    icon={
                      <span
                        aria-hidden="true"
                        className={styles.templateButtonLabel}
                      >
                        {template.buttonLabel}
                      </span>
                    }
                    iconSizing="content"
                    onPress={() => setTemplate(template.recipe)}
                    selected={activeTemplate?.id === template.id}
                    unavailable={!onRhythmRecipeChange}
                  />
                ))}
              </TactileControlGroup>
            </div>

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

              <TactileControlGroup
                aria-label="Beat grouping"
                className={`${controlStyles.controlGroup} ${styles.groupingControl}`}
                controlsClassName={controlStyles.buttonGroup}
                readout={groupingReadout}
                readoutAriaLabel={`Beat grouping: ${groupingReadout}`}
                readoutClassName={styles.recipeReadout}
              >
                {groupingChoices.map((grouping) => (
                  <PartModuleControlButton
                    key={grouping}
                    aria-label={getGroupingControlLabel(recipe.beats, grouping)}
                    icon={
                      <span
                        aria-hidden="true"
                        className={styles.groupingButtonLabel}
                      >
                        {getRhythmGroupingChoiceLabel(recipe.beats, grouping)}
                      </span>
                    }
                    iconSizing="content"
                    onPress={() => setGrouping(grouping)}
                    selected={recipe.grouping === grouping}
                    unavailable={!onRhythmRecipeChange}
                  />
                ))}
              </TactileControlGroup>
            </div>

            <div
              aria-label="Groove foundation"
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
                    iconSizing="content"
                    onPress={() => setGroove(choice.groove)}
                    selected={recipe.groove === choice.groove}
                    unavailable={!onRhythmRecipeChange}
                  />
                ))}
              </TactileControlGroup>
            </div>

            <div
              aria-label="Timekeeper"
              className={controlStyles.controlStack}
              role="group"
            >
              <TactileControlGroup
                aria-label="Timekeeper"
                className={controlStyles.controlGroup}
                controlsClassName={controlStyles.controlStack}
                readout={timekeeperLabel}
                readoutAriaLabel={`Timekeeper: ${timekeeperLabel}`}
                readoutClassName={styles.recipeReadout}
              >
                <span
                  aria-label="Timekeeper sound"
                  className={controlStyles.buttonGroup}
                  role="group"
                >
                  {timekeeperSoundChoices.map((choice) => (
                    <PartModuleControlButton
                      key={choice.sound}
                      aria-label={choice.label}
                      icon={choice.icon}
                      iconSizing="content"
                      onPress={() => updateTimekeeper({ sound: choice.sound })}
                      selected={recipe.timekeeper.sound === choice.sound}
                      unavailable={!onRhythmRecipeChange}
                    />
                  ))}
                </span>

                <span
                  aria-label="Timekeeper rhythm"
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
                          className={styles.timekeeperRhythmButtonLabel}
                        >
                          {choice.text}
                        </span>
                      }
                      iconSizing="content"
                      onPress={() =>
                        updateTimekeeper({
                          feel: choice.feel,
                          subdivision: choice.subdivision,
                        })
                      }
                      selected={
                        recipe.timekeeper.feel === choice.feel &&
                        (choice.feel === "off" ||
                          recipe.timekeeper.subdivision === choice.subdivision)
                      }
                      unavailable={!onRhythmRecipeChange}
                    />
                  ))}
                </span>
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
