"use client";

import { useEffect } from "react";
import { WoodSurfaceDisclosureItem } from "@/components/appearance/WoodSurfaceChoiceList";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
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
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";
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
  getRhythmBeatControlLabel,
  getRhythmGroupingControlLabel,
  getRhythmStarterChoiceForRecipe,
  getRhythmStarterRecipe,
  getRhythmStarterSummary,
  isRhythmGrooveChoiceAvailable,
  isRhythmTimekeeperSubdivisionChoiceAvailable,
  rhythmGrooveChoices,
  rhythmStarterChoices,
  rhythmTimekeeperSoundChoices,
  rhythmTimekeeperSubdivisionChoices,
} from "./rhythmRecipeControls";

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
  >();
  const rhythm = value.rhythm ?? DEFAULT_RHYTHM_SELECTION;
  const recipe = getRhythmSelectionRecipe(rhythm);
  const beatLabel = getRhythmBeatControlLabel(recipe.beats);
  const groupingChoices = getRhythmGroupingOptions(recipe.beats);
  const groupingLabel = getRhythmGroupingChoiceLabel(
    recipe.beats,
    recipe.grouping,
  );
  const wood = value.wood ?? DEFAULT_WOOD_SURFACE_ID;
  const isTimekeeperOff = recipe.timekeeper.feel === "off";
  const hasGroupingChoices = groupingChoices.length > 1;
  const foundationLabel = getRhythmGrooveOptionLabel(recipe.groove);
  const timekeeperLabel = isTimekeeperOff
    ? "Off"
    : getRhythmTimekeeperOptionLabel("sound", recipe.timekeeper);
  const feelLabel = getRhythmTimekeeperRhythmReadoutLabel(recipe.timekeeper);
  const selectedStarterChoice = getRhythmStarterChoiceForRecipe(recipe);
  const starterLabel = selectedStarterChoice?.label ?? "Custom";

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  useEffect(() => {
    if (isTimekeeperOff) {
      closeChoice("subdivision");
    }
  }, [closeChoice, isTimekeeperOff]);

  useEffect(() => {
    if (!hasGroupingChoices) {
      closeChoice("variation");
    }
  }, [closeChoice, hasGroupingChoices]);

  const updateRecipe = (nextRecipe: RhythmRecipe) => {
    onChange({
      ...value,
      rhythm: {
        recipe: nextRecipe,
        source: "recipe",
      },
    });
  };

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

  const getTimekeeperSoundChoiceLabel = (
    sound: RhythmTimekeeperSound | undefined,
  ) =>
    sound === undefined
      ? "Off"
      : getRhythmTimekeeperOptionLabel("sound", {
          ...recipe.timekeeper,
          sound,
        });

  return (
    <section className={styles.section} aria-label={ariaLabel}>
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
            {rhythmStarterChoices.map((choice) => (
              <DisclosureListChoice
                key={choice.id}
                aria-label={`Start with ${choice.label}`}
                label={choice.label}
                selected={selectedStarterChoice?.id === choice.id}
                subtitle={getRhythmStarterSummary(choice.id)}
                onClick={() => {
                  updateRecipe(getRhythmStarterRecipe(choice.id));
                  closeChoice("starter");
                }}
              />
            ))}
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
          <NumericStepper
            aria-label="Rhythm beats"
            formatValue={getRhythmBeatControlLabel}
            max={RHYTHM_MAX_BEATS}
            min={RHYTHM_MIN_BEATS}
            value={recipe.beats}
            onChange={(beats) =>
              updateRecipe(getRecipeWithBeatCount(recipe, beats))
            }
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Variation. Current: ${groupingLabel}`}
          disabled={!hasGroupingChoices}
          isOpen={isChoiceOpen("variation")}
          label="Variation"
          panelVariant="menu"
          preview={groupingLabel}
          onToggle={() => toggleChoice("variation")}
        >
          <DisclosureList density="compact">
            {groupingChoices.map((grouping) => {
              const choiceLabel = getRhythmGroupingChoiceLabel(
                recipe.beats,
                grouping,
              );

              return (
                <DisclosureListChoice
                  key={grouping}
                  aria-label={getRhythmGroupingControlLabel(
                    recipe.beats,
                    grouping,
                  )}
                  label={choiceLabel}
                  selected={recipe.grouping === grouping}
                  onClick={() =>
                    updateRecipe(getRecipeWithGrouping(recipe, grouping))
                  }
                />
              );
            })}
          </DisclosureList>
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
          <DisclosureList density="compact">
            {rhythmTimekeeperSoundChoices.map((choice) => (
              <DisclosureListChoice
                key={choice.sound ?? "off"}
                aria-label={choice.label}
                label={getTimekeeperSoundChoiceLabel(choice.sound)}
                selected={
                  choice.sound === undefined
                    ? isTimekeeperOff
                    : !isTimekeeperOff &&
                      recipe.timekeeper.sound === choice.sound
                }
                onClick={() => setTimekeeperSound(choice.sound)}
              />
            ))}
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Subdivision. Current: ${feelLabel}`}
          disabled={isTimekeeperOff}
          isOpen={isChoiceOpen("subdivision")}
          label="Subdivision"
          panelVariant="menu"
          preview={feelLabel}
          onToggle={() => toggleChoice("subdivision")}
        >
          <DisclosureList density="compact">
            {rhythmTimekeeperSubdivisionChoices.map((choice) => {
              const choiceLabel = getRhythmTimekeeperRhythmReadoutLabel({
                ...recipe.timekeeper,
                feel: choice.feel,
                subdivision: choice.subdivision,
              });

              return (
                <DisclosureListChoice
                  key={`${choice.subdivision}-${choice.feel}`}
                  aria-label={choice.label}
                  disabled={
                    !isRhythmTimekeeperSubdivisionChoiceAvailable(
                      recipe,
                      choice,
                    )
                  }
                  label={choiceLabel}
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
              );
            })}
          </DisclosureList>
        </DisclosureListItem>

        <WoodSurfaceDisclosureItem
          isOpen={isChoiceOpen("wood")}
          keepMounted
          surfaceId={wood}
          onChange={handleWoodChange}
          onToggle={() => toggleChoice("wood")}
        />
      </DisclosureList>
    </section>
  );
}
