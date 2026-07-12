import { type ReactNode } from "react";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import { type RhythmRecipe } from "@/utils/rhythm/rhythmConfig";
import {
  getRhythmStarterChoiceForRecipe,
  getRhythmStarterRecipe,
  getRhythmStarterSummary,
  isRhythmStarterChoiceAvailable,
  rhythmStarterChoices,
  type RhythmBeatCountConstraint,
} from "./rhythmRecipeControls";

interface RhythmPresetDisclosureItemProps {
  beatCountConstraint?: RhythmBeatCountConstraint;
  icon?: ReactNode;
  isOpen: boolean;
  onChange: (recipe: RhythmRecipe) => void;
  onClose: () => void;
  onToggle: () => void;
  recipe: RhythmRecipe;
}

/** A shared recipe-template picker for Rhythm creation and local editing. */
export function RhythmPresetDisclosureItem({
  beatCountConstraint,
  icon,
  isOpen,
  onChange,
  onClose,
  onToggle,
  recipe,
}: RhythmPresetDisclosureItemProps) {
  const selectedPreset = getRhythmStarterChoiceForRecipe(recipe);
  const presetLabel = selectedPreset?.label ?? "Custom";

  return (
    <DisclosureListItem
      ariaLabel={`Rhythm preset. Current: ${presetLabel}`}
      icon={icon}
      isOpen={isOpen}
      label="Preset"
      panelVariant="menu"
      preview={presetLabel}
      onToggle={onToggle}
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
                  ? `Use ${choice.label} rhythm preset`
                  : `${choice.label} rhythm preset. Not compatible with this progression`
              }
              disabled={!isAvailable}
              label={choice.label}
              selected={selectedPreset?.id === choice.id}
              subtitle={
                isAvailable
                  ? getRhythmStarterSummary(choice.id)
                  : "Not compatible with this progression"
              }
              onClick={() => {
                onChange(getRhythmStarterRecipe(choice.id));
                onClose();
              }}
            />
          );
        })}
      </DisclosureList>
    </DisclosureListItem>
  );
}
