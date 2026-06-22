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
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import {
  getRhythmCompatibleTimekeeper,
  getRhythmGroupingChoiceLabel,
  getRhythmGroupingOptions,
  getRhythmTheoryReadout,
  getRhythmTimekeeperRhythmReadoutLabel,
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
  rhythmGrooveSupportsBeatCount,
  rhythmRecipeSupportsTimekeeperFeel,
} from "@/data/rhythmPresets";
import { woodSurfaces } from "@/data/woodSurfaces";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
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
    sound: undefined,
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
  sound: RhythmTimekeeperSound | undefined;
}[];

const grooveChoices = [
  {
    groove: "pulse",
    label: "Use bass drum pulse on the counted beats",
    text: "Pulse",
  },
  {
    groove: "kit",
    label: "Use kick and snare kit foundation",
    text: "Kit",
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
    label: "Use swing eighths timekeeper pattern",
    text: "Sw",
    feel: "swing",
    subdivision: "eighth",
  },
  {
    label: "Use shuffle eighths timekeeper pattern",
    text: "Shf",
    feel: "shuffle",
    subdivision: "eighth",
  },
] as const satisfies readonly {
  feel: RhythmTimekeeperFeel;
  label: string;
  subdivision: RhythmTimekeeperSubdivision;
  text: string;
}[];

const RHYTHM_FRAME_STYLE = {
  "--part-module-body-background": woodSurfaces.rosewood.background,
} as CSSProperties;

function clampBeatCount(beats: number) {
  return Math.min(RHYTHM_MAX_BEATS, Math.max(RHYTHM_MIN_BEATS, beats));
}

function getRecipeWithBeatCount(recipe: RhythmRecipe, beats: number) {
  const nextBeats = clampBeatCount(beats);
  const groove = rhythmGrooveSupportsBeatCount(recipe.groove, nextBeats)
    ? recipe.groove
    : "pulse";
  const timekeeper = getRhythmCompatibleTimekeeper(
    groove,
    nextBeats,
    recipe.timekeeper,
  );

  return {
    ...recipe,
    beats: nextBeats,
    groove,
    grouping: getRhythmGroupingOptions(nextBeats).includes(recipe.grouping)
      ? recipe.grouping
      : "auto",
    timekeeper,
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
  const nextGroove = rhythmGrooveSupportsBeatCount(groove, recipe.beats)
    ? groove
    : "pulse";
  const timekeeper = getRhythmCompatibleTimekeeper(
    nextGroove,
    recipe.beats,
    recipe.timekeeper,
  );

  return {
    ...recipe,
    groove: nextGroove,
    timekeeper,
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
  const compatibleTimekeeper = getRhythmCompatibleTimekeeper(
    recipe.groove,
    recipe.beats,
    {
      ...recipe.timekeeper,
      ...patch,
    },
  );

  return {
    ...recipe,
    timekeeper: compatibleTimekeeper,
  };
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
  const transportShortcuts = useScopedTransportShortcuts({
    isActive: playback.isActive,
    onStop: playback.stop,
  });
  const recipe = getRhythmSelectionRecipe(rhythm);
  const beatCountLabel = getBeatControlLabel(recipe.beats);
  const groupingChoices = getRhythmGroupingOptions(recipe.beats);
  const timekeeperSoundLabel = getRhythmTimekeeperOptionLabel(
    "sound",
    recipe.timekeeper,
  );
  const timekeeperRhythmLabel = getRhythmTimekeeperRhythmReadoutLabel(
    recipe.timekeeper,
  );
  const timekeeperLabel =
    recipe.timekeeper.feel === "off"
      ? "Off"
      : `${timekeeperSoundLabel}${DISPLAY_VALUE_SEPARATOR}${timekeeperRhythmLabel}`;
  const isTimekeeperOff = recipe.timekeeper.feel === "off";
  const rhythmTheoryReadout = getRhythmTheoryReadout(recipe);
  const rhythmTheoryAriaLabel = rhythmTheoryReadout.detail
    ? `Rhythm theory: ${rhythmTheoryReadout.title}. ${rhythmTheoryReadout.detail}`
    : `Rhythm theory: ${rhythmTheoryReadout.title}`;
  const canDecreaseBeats = recipe.beats > RHYTHM_MIN_BEATS;
  const canIncreaseBeats = recipe.beats < RHYTHM_MAX_BEATS;

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

  const setTimekeeperSound = (sound: RhythmTimekeeperSound | undefined) => {
    if (sound === undefined) {
      updateTimekeeper({ feel: "off" });
      return;
    }

    updateTimekeeper({
      sound,
      ...(isTimekeeperOff ? { feel: "straight" as const } : {}),
    });
  };

  return (
    <>
      <PartModuleFrame
        bodyClassName={controlStyles.body}
        className={`${styles.frame} ${controlStyles.surface}`}
        headerPrimary={<InstrumentIdentity label="Rhythm" />}
        onKeyDownCapture={transportShortcuts.onKeyDownCapture}
        onPointerDownCapture={transportShortcuts.onPointerDownCapture}
        showHeader={showHeader}
        style={RHYTHM_FRAME_STYLE}
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
                  aria-keyshortcuts={
                    playback.isActive ? "Space Escape" : undefined
                  }
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
              <div
                aria-label="Meter"
                className={controlStyles.controlStack}
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
                  aria-label="Beat variation"
                  className={`${controlStyles.controlGroup} ${styles.groupingControl}`}
                  controlsClassName={controlStyles.buttonGroup}
                >
                  {groupingChoices.map((grouping) => (
                    <PartModuleControlButton
                      key={grouping}
                      aria-label={getGroupingControlLabel(
                        recipe.beats,
                        grouping,
                      )}
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
              >
                {grooveChoices.map((choice) => (
                  <PartModuleControlButton
                    key={choice.groove}
                    aria-label={choice.label}
                    icon={
                      <span
                        aria-hidden="true"
                        className={styles.grooveButtonLabel}
                      >
                        {choice.text}
                      </span>
                    }
                    iconSizing="content"
                    onPress={() => setGroove(choice.groove)}
                    selected={recipe.groove === choice.groove}
                    unavailable={
                      !onRhythmRecipeChange ||
                      !rhythmGrooveSupportsBeatCount(
                        choice.groove,
                        recipe.beats,
                      )
                    }
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
                      key={choice.sound ?? "off"}
                      aria-label={choice.label}
                      icon={choice.icon}
                      iconSizing="content"
                      onPress={() => setTimekeeperSound(choice.sound)}
                      selected={
                        choice.sound === undefined
                          ? isTimekeeperOff
                          : !isTimekeeperOff &&
                            recipe.timekeeper.sound === choice.sound
                      }
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
                        recipe.timekeeper.subdivision === choice.subdivision
                      }
                      unavailable={
                        !onRhythmRecipeChange ||
                        isTimekeeperOff ||
                        !rhythmRecipeSupportsTimekeeperFeel(
                          recipe.groove,
                          recipe.beats,
                          choice.feel,
                        )
                      }
                    />
                  ))}
                </span>
              </TactileControlGroup>
            </div>

            <output
              aria-label={rhythmTheoryAriaLabel}
              aria-live="off"
              className={`${controlStyles.moduleReadoutPanel} ${styles.theoryReadout}`}
              data-has-detail={rhythmTheoryReadout.detail ? true : undefined}
            >
              <span
                className={`${controlStyles.moduleReadoutPanelPrimary} ${styles.theoryReadoutTitle}`}
              >
                {rhythmTheoryReadout.title}
              </span>
              {rhythmTheoryReadout.detail ? (
                <span
                  className={`${controlStyles.moduleReadoutPanelSecondary} ${styles.theoryReadoutDetail}`}
                >
                  {rhythmTheoryReadout.detail}
                </span>
              ) : null}
            </output>
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
