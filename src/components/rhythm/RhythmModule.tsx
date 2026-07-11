"use client";

import { type CSSProperties, useState } from "react";
import { Gauge, Minus, Play, Plus, Square } from "lucide-react";
import { InstrumentIdentity } from "@/components/instrument/InstrumentIdentity";
import { PartModuleControlButton } from "@/components/part-module/PartModuleControlButton";
import controlStyles from "@/components/part-module/PartModuleControls.module.css";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { PartModuleHeaderActions } from "@/components/part-module/PartModuleHeaderActions";
import { PartModuleBandSourceIndicator } from "@/components/part-module/PartModuleBandSource";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import { useRhythmPlayback } from "@/hooks/audio/useRhythmPlayback";
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import {
  getRhythmGroupingChoiceLabel,
  getRhythmGroupingOptions,
  getRhythmTheoryReadout,
  getRhythmTimekeeperRhythmReadoutLabel,
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
} from "@/data/rhythmPresets";
import {
  DEFAULT_WOOD_SURFACE_ID,
  woodSurfaces,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import {
  getRhythmSelectionRecipe,
  getRhythmTimekeeperOptionLabel,
  type RhythmGroove,
  type RhythmGrouping,
  type RhythmRecipe,
  type RhythmSelection,
  type RhythmTimekeeperSound,
} from "@/utils/rhythm/rhythmConfig";
import {
  getRecipeWithBeatCount,
  getRecipeWithGrouping,
  getRecipeWithGroove,
  getRecipeWithTimekeeper,
  getRhythmBeatControlLabel,
  getRhythmGroupingControlLabel,
  isRhythmGrooveChoiceAvailable,
  isRhythmTimekeeperSubdivisionChoiceAvailable,
  rhythmGrooveChoices,
  rhythmTimekeeperFeelSubdivisionChoices,
  rhythmTimekeeperSoundChoices,
  rhythmTimekeeperStraightSubdivisionChoices,
} from "./rhythmRecipeControls";
import { RhythmOptionsDialog } from "./RhythmOptionsDialog";
import styles from "./RhythmModule.module.css";

export function RhythmModule({
  isBandSource = false,
  moduleId,
  onClone,
  onOpenSessionTempo,
  onRemove,
  onRhythmRecipeChange,
  onWoodChange,
  rhythm,
  showHeader = true,
  tempoBpm = 80,
  wood = DEFAULT_WOOD_SURFACE_ID,
}: {
  isBandSource?: boolean;
  moduleId: string;
  onClone?: () => void;
  onOpenSessionTempo?: () => void;
  onRemove?: () => void;
  onRhythmRecipeChange?: (value: RhythmRecipe) => void;
  onWoodChange?: (value: WoodSurfaceId) => void;
  rhythm: RhythmSelection;
  showHeader?: boolean;
  tempoBpm?: number;
  wood?: WoodSurfaceId;
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
  const beatCountLabel = getRhythmBeatControlLabel(recipe.beats);
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
        headerPrimary={
          <InstrumentIdentity
            accessory={
              isBandSource ? <PartModuleBandSourceIndicator /> : undefined
            }
            label="Rhythm"
          />
        }
        onKeyDownCapture={transportShortcuts.onKeyDownCapture}
        onPointerDownCapture={transportShortcuts.onPointerDownCapture}
        showHeader={showHeader}
        style={
          {
            "--part-module-body-background": woodSurfaces[wood].background,
          } as CSSProperties
        }
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
        <div className={controlStyles.content}>
          <div
            aria-label="Rhythm controls"
            className={controlStyles.controlDeck}
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
                      aria-label={getRhythmGroupingControlLabel(
                        recipe.beats,
                        grouping,
                      )}
                      icon={
                        <span
                          aria-hidden="true"
                          className={controlStyles.controlDenseTextIconLabel}
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
                {rhythmGrooveChoices.map((choice) => (
                  <PartModuleControlButton
                    key={choice.groove}
                    aria-label={choice.label}
                    icon={
                      <span
                        aria-hidden="true"
                        className={controlStyles.controlTextIconLabel}
                      >
                        {choice.text}
                      </span>
                    }
                    iconSizing="content"
                    onPress={() => setGroove(choice.groove)}
                    selected={recipe.groove === choice.groove}
                    unavailable={
                      !onRhythmRecipeChange ||
                      !isRhythmGrooveChoiceAvailable(recipe, choice.groove)
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
                  {rhythmTimekeeperSoundChoices.map((choice) => (
                    <PartModuleControlButton
                      key={choice.sound ?? "off"}
                      aria-label={choice.label}
                      icon={
                        <span
                          aria-hidden="true"
                          className={controlStyles.controlTextIconLabel}
                        >
                          {choice.text}
                        </span>
                      }
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
                  className={styles.timekeeperRhythmSelector}
                  role="group"
                >
                  <span
                    aria-label="Timekeeper subdivisions"
                    className={`${controlStyles.buttonGroup} ${controlStyles.compactButtonGrid} ${styles.timekeeperSubdivisionControls}`}
                    role="group"
                  >
                    {rhythmTimekeeperStraightSubdivisionChoices.map(
                      (choice) => (
                        <PartModuleControlButton
                          key={`${choice.subdivision}-${choice.feel}`}
                          aria-label={choice.label}
                          icon={
                            <span
                              aria-hidden="true"
                              className={`${controlStyles.controlTextIconLabel} ${styles.timekeeperRhythmButtonLabel}`}
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
                            !isRhythmTimekeeperSubdivisionChoiceAvailable(
                              recipe,
                              choice,
                            )
                          }
                        />
                      ),
                    )}
                  </span>

                  <span
                    aria-label="Timekeeper feels"
                    className={`${controlStyles.buttonGroup} ${styles.timekeeperFeelControls}`}
                    role="group"
                  >
                    {rhythmTimekeeperFeelSubdivisionChoices.map((choice) => (
                      <PartModuleControlButton
                        key={`${choice.subdivision}-${choice.feel}`}
                        aria-label={choice.label}
                        icon={
                          <span
                            aria-hidden="true"
                            className={`${controlStyles.controlTextIconLabel} ${styles.timekeeperRhythmButtonLabel}`}
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
                          !isRhythmTimekeeperSubdivisionChoiceAvailable(
                            recipe,
                            choice,
                          )
                        }
                      />
                    ))}
                  </span>
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
          wood={wood}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onRemove={onRemove}
          onWoodChange={onWoodChange}
        />
      ) : null}
    </>
  );
}
