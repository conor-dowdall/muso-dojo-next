"use client";

import { useEffect } from "react";
import { WoodSurfaceDisclosureItem } from "@/components/appearance/WoodSurfaceChoiceList";
import creationStyles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import choiceGridStyles from "@/components/ui/choice-grid/ChoiceGrid.module.css";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  DEFAULT_WOOD_SURFACE_ID,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  getRhythmGroupingChoiceLabel,
  getRhythmGroupingOptions,
  getRhythmGrooveOptionLabel,
  getRhythmTimekeeperRhythmReadoutLabel,
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
} from "@/data/rhythmPresets";
import { type RhythmModuleCreationDefault } from "@/types/instrument-creation-defaults";
import {
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionRecipe,
  getRhythmTimekeeperOptionLabel,
  type RhythmRecipe,
  type RhythmTimekeeperSound,
} from "@/utils/rhythm/rhythmConfig";
import {
  getRecipeWithBeatCount,
  getRecipeWithGrouping,
  getRecipeWithGroove,
  getRecipeWithTimekeeper,
  getCompatibleRhythmBeatCounts,
  getRhythmBeatControlLabel,
  getRhythmGroupingControlLabel,
  getRhythmStarterChoiceForRecipe,
  getRhythmStarterRecipe,
  getRhythmStarterSummary,
  getRecipeWithBeatCountConstraint,
  isRhythmGrooveChoiceAvailable,
  isRhythmStarterChoiceAvailable,
  isRhythmTimekeeperSubdivisionChoiceAvailable,
  type RhythmBeatCountConstraint,
  rhythmGrooveChoices,
  rhythmStarterChoices,
  rhythmTimekeeperFeelSubdivisionChoices,
  rhythmTimekeeperSoundChoices,
  rhythmTimekeeperStraightSubdivisionChoices,
} from "./rhythmRecipeControls";
import styles from "./RhythmCreationPanel.module.css";

interface RhythmCreationPanelProps {
  ariaLabel?: string;
  beatCountConstraint?: RhythmBeatCountConstraint;
  closeSignal?: number;
  onChange: (value: RhythmModuleCreationDefault) => void;
  value: RhythmModuleCreationDefault;
  showWood?: boolean;
}

export function RhythmCreationPanel({
  ariaLabel = "Rhythm settings",
  beatCountConstraint,
  closeSignal,
  onChange,
  showWood = true,
  value,
}: RhythmCreationPanelProps) {
  const {
    closeAll,
    closeChoice,
    isOpen: isChoiceOpen,
    toggleChoice,
  } = useDisclosureList<
    | "beats"
    | "foundation"
    | "starter"
    | "subdivision"
    | "timekeeper"
    | "variation"
    | "wood"
  >(null);
  const rhythm = value.rhythm ?? DEFAULT_RHYTHM_SELECTION;
  const recipe = getRhythmSelectionRecipe(rhythm);
  const groupingChoices = getRhythmGroupingOptions(recipe.beats);
  const groupingLabel = getRhythmGroupingChoiceLabel(
    recipe.beats,
    recipe.grouping,
  );
  const wood = value.wood ?? DEFAULT_WOOD_SURFACE_ID;
  const isTimekeeperOff = recipe.timekeeper.feel === "off";
  const foundationLabel = getRhythmGrooveOptionLabel(recipe.groove);
  const timekeeperLabel = isTimekeeperOff
    ? "Off"
    : getRhythmTimekeeperOptionLabel("sound", recipe.timekeeper);
  const subdivisionLabel = getRhythmTimekeeperRhythmReadoutLabel(
    recipe.timekeeper,
  );
  const selectedStarterChoice = getRhythmStarterChoiceForRecipe(recipe);
  const starterLabel = selectedStarterChoice?.label ?? "Custom";
  const beatLabel = getRhythmBeatControlLabel(recipe.beats);
  const compatibleBeatCounts =
    getCompatibleRhythmBeatCounts(beatCountConstraint);
  const beatChoices = Array.from(
    { length: RHYTHM_MAX_BEATS - RHYTHM_MIN_BEATS + 1 },
    (_, index) => RHYTHM_MIN_BEATS + index,
  );

  const updateRecipe = (nextRecipe: RhythmRecipe) => {
    const constrainedRecipe = getRecipeWithBeatCountConstraint(
      nextRecipe,
      beatCountConstraint,
    );

    onChange({
      ...value,
      rhythm: {
        recipe: constrainedRecipe,
        source: "recipe",
      },
    });
  };

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  useEffect(() => {
    if (groupingChoices.length < 2) {
      closeChoice("variation");
    }
  }, [closeChoice, groupingChoices.length]);

  useEffect(() => {
    if (isTimekeeperOff) {
      closeChoice("subdivision");
    }
  }, [closeChoice, isTimekeeperOff]);

  const handleWoodChange = (nextWood: WoodSurfaceId) => {
    onChange({ ...value, wood: nextWood });
  };

  const setTimekeeperSound = (sound: RhythmTimekeeperSound | undefined) => {
    if (sound === undefined) {
      updateRecipe(getRecipeWithTimekeeper(recipe, { feel: "off" }));
      return;
    }

    updateRecipe(
      getRecipeWithTimekeeper(recipe, {
        sound,
        ...(isTimekeeperOff ? { feel: "straight" as const } : {}),
      }),
    );
  };

  return (
    <section className={creationStyles.section} aria-label={ariaLabel}>
      <DisclosureList>
        <DisclosureListItem
          ariaLabel={`Start from rhythm. Current: ${starterLabel}`}
          isOpen={isChoiceOpen("starter")}
          label="Start From"
          panelVariant="menu"
          preview={starterLabel}
          onToggle={() => toggleChoice("starter")}
        >
          <DisclosureList density="compact">
            {rhythmStarterChoices.map((choice) => {
              const isAvailable = isRhythmStarterChoiceAvailable(
                choice.id,
                beatCountConstraint,
              );

              return (
                <DisclosureListChoice
                  key={choice.id}
                  aria-label={
                    isAvailable
                      ? `Start with ${choice.label}`
                      : `Start with ${choice.label}. Not compatible with this progression`
                  }
                  disabled={!isAvailable}
                  label={choice.label}
                  selected={selectedStarterChoice?.id === choice.id}
                  subtitle={
                    isAvailable
                      ? getRhythmStarterSummary(choice.id)
                      : "Not compatible with this progression"
                  }
                  onClick={() => {
                    updateRecipe(getRhythmStarterRecipe(choice.id));
                    closeChoice("starter");
                  }}
                />
              );
            })}
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Beats. Current: ${beatLabel}`}
          isOpen={isChoiceOpen("beats")}
          label="Beats"
          panelVariant="menu"
          preview={beatLabel}
          onToggle={() => toggleChoice("beats")}
        >
          <div
            aria-label="Rhythm beats"
            className={`${choiceGridStyles.tokenGrid} ${styles.numericGrid}`}
            role="group"
          >
            {beatChoices.map((beats) => {
              const isAvailable = compatibleBeatCounts.includes(beats);

              return (
                <OptionButton
                  key={beats}
                  aria-label={
                    isAvailable
                      ? `Use ${beats} ${beats === 1 ? "beat" : "beats"}`
                      : `${beats} beats. Not compatible with this progression`
                  }
                  className={`${choiceGridStyles.tokenChoice} ${choiceGridStyles.squareTokenChoice}`}
                  disabled={!isAvailable}
                  label={beats}
                  presentation="tile"
                  selected={recipe.beats === beats}
                  onClick={() =>
                    updateRecipe(getRecipeWithBeatCount(recipe, beats))
                  }
                />
              );
            })}
          </div>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Variation. Current: ${groupingLabel}`}
          disabled={groupingChoices.length < 2}
          isOpen={isChoiceOpen("variation")}
          label="Variation"
          panelVariant="menu"
          preview={groupingLabel}
          onToggle={() => toggleChoice("variation")}
        >
          <div
            aria-label="Beat variation"
            className={`${choiceGridStyles.tokenGrid} ${styles.variationGrid}`}
            role="group"
          >
            {groupingChoices.map((grouping) => (
              <OptionButton
                key={grouping}
                aria-label={getRhythmGroupingControlLabel(
                  recipe.beats,
                  grouping,
                )}
                className={choiceGridStyles.tokenChoice}
                label={getRhythmGroupingChoiceLabel(recipe.beats, grouping)}
                presentation="tile"
                selected={recipe.grouping === grouping}
                onClick={() =>
                  updateRecipe(getRecipeWithGrouping(recipe, grouping))
                }
              />
            ))}
          </div>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Foundation. Current: ${foundationLabel}`}
          isOpen={isChoiceOpen("foundation")}
          label="Foundation"
          panelVariant="menu"
          preview={foundationLabel}
          onToggle={() => toggleChoice("foundation")}
        >
          <DisclosureList density="compact">
            {rhythmGrooveChoices.map((choice) => (
              <DisclosureListChoice
                key={choice.groove}
                aria-label={choice.label}
                disabled={!isRhythmGrooveChoiceAvailable(recipe, choice.groove)}
                label={choice.text}
                selected={recipe.groove === choice.groove}
                subtitle={choice.description}
                onClick={() =>
                  updateRecipe(getRecipeWithGroove(recipe, choice.groove))
                }
              />
            ))}
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Timekeeper. Current: ${timekeeperLabel}`}
          isOpen={isChoiceOpen("timekeeper")}
          label="Timekeeper"
          panelVariant="menu"
          preview={timekeeperLabel}
          onToggle={() => toggleChoice("timekeeper")}
        >
          <div
            aria-label="Timekeeper sound"
            className={`${choiceGridStyles.tokenGrid} ${styles.timekeeperGrid}`}
            role="group"
          >
            {rhythmTimekeeperSoundChoices.map((choice) => (
              <OptionButton
                key={choice.sound ?? "off"}
                aria-label={choice.label}
                className={choiceGridStyles.tokenChoice}
                label={choice.name}
                presentation="tile"
                selected={
                  choice.sound === undefined
                    ? isTimekeeperOff
                    : !isTimekeeperOff &&
                      recipe.timekeeper.sound === choice.sound
                }
                onClick={() => setTimekeeperSound(choice.sound)}
              />
            ))}
          </div>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Timekeeper Pattern. Current: ${subdivisionLabel}`}
          disabled={isTimekeeperOff}
          isOpen={isChoiceOpen("subdivision")}
          label="Timekeeper Pattern"
          panelVariant="menu"
          preview={subdivisionLabel}
          onToggle={() => toggleChoice("subdivision")}
        >
          <div className={styles.patternGroups}>
            <div
              aria-label="Even subdivisions per beat"
              className={`${choiceGridStyles.tokenGrid} ${styles.numericGrid}`}
              role="group"
            >
              {rhythmTimekeeperStraightSubdivisionChoices.map((choice) => (
                <OptionButton
                  key={`${choice.subdivision}-${choice.feel}`}
                  aria-label={choice.label}
                  className={`${choiceGridStyles.tokenChoice} ${choiceGridStyles.squareTokenChoice}`}
                  disabled={
                    !isRhythmTimekeeperSubdivisionChoiceAvailable(
                      recipe,
                      choice,
                    )
                  }
                  label={choice.text}
                  presentation="tile"
                  selected={
                    recipe.timekeeper.feel === choice.feel &&
                    recipe.timekeeper.subdivision === choice.subdivision
                  }
                  onClick={() =>
                    updateRecipe(
                      getRecipeWithTimekeeper(recipe, {
                        feel: choice.feel,
                        subdivision: choice.subdivision,
                      }),
                    )
                  }
                />
              ))}
            </div>

            <div
              aria-label="Timekeeper feel"
              className={`${choiceGridStyles.tokenGrid} ${styles.feelGrid}`}
              role="group"
            >
              {rhythmTimekeeperFeelSubdivisionChoices.map((choice) => (
                <OptionButton
                  key={`${choice.subdivision}-${choice.feel}`}
                  aria-label={choice.label}
                  className={choiceGridStyles.tokenChoice}
                  disabled={
                    !isRhythmTimekeeperSubdivisionChoiceAvailable(
                      recipe,
                      choice,
                    )
                  }
                  label={choice.feel === "swing" ? "Swing" : "Shuffle"}
                  presentation="tile"
                  selected={
                    recipe.timekeeper.feel === choice.feel &&
                    recipe.timekeeper.subdivision === choice.subdivision
                  }
                  onClick={() =>
                    updateRecipe(
                      getRecipeWithTimekeeper(recipe, {
                        feel: choice.feel,
                        subdivision: choice.subdivision,
                      }),
                    )
                  }
                />
              ))}
            </div>
          </div>
        </DisclosureListItem>

        {showWood ? (
          <WoodSurfaceDisclosureItem
            isOpen={isChoiceOpen("wood")}
            keepMounted
            surfaceId={wood}
            onChange={handleWoodChange}
            onToggle={() => toggleChoice("wood")}
          />
        ) : null}
      </DisclosureList>
    </section>
  );
}
