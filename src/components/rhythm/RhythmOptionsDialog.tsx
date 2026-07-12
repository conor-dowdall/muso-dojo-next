"use client";

import { Drum, SwatchBook } from "lucide-react";
import { WoodSurfaceDisclosureItem } from "@/components/appearance/WoodSurfaceChoiceList";
import {
  DisclosureListGroup,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import {
  DEFAULT_WOOD_SURFACE_ID,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import { type RhythmRecipe } from "@/utils/rhythm/rhythmConfig";
import { RhythmPresetDisclosureItem } from "./RhythmPresetDisclosureItem";
type MenuChoice = "preset" | "wood";

export function RhythmOptionsDialog({
  isOpen,
  onClone,
  onClose,
  onRemove,
  onRhythmRecipeChange,
  onWoodChange,
  recipe,
  wood = DEFAULT_WOOD_SURFACE_ID,
}: {
  isOpen: boolean;
  onClone?: () => void;
  onClose: () => void;
  onRemove?: () => void;
  onRhythmRecipeChange: (value: RhythmRecipe) => void;
  onWoodChange?: (value: WoodSurfaceId) => void;
  recipe: RhythmRecipe;
  wood?: WoodSurfaceId;
}) {
  const {
    closeChoice,
    isOpen: isChoiceOpen,
    toggleChoice,
  } = useDisclosureList<MenuChoice>(null);

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Rhythm Options" onClose={onClose}>
      <DisclosureListGroup>
        <RhythmPresetDisclosureItem
          icon={<Drum />}
          isOpen={isChoiceOpen("preset")}
          recipe={recipe}
          onChange={onRhythmRecipeChange}
          onClose={() => closeChoice("preset")}
          onToggle={() => toggleChoice("preset")}
        />

        <WoodSurfaceDisclosureItem
          icon={<SwatchBook />}
          isOpen={isChoiceOpen("wood")}
          surfaceId={wood}
          onChange={(value) => onWoodChange?.(value)}
          onToggle={() => toggleChoice("wood")}
        />
      </DisclosureListGroup>

      <ObjectManagementGroup
        kind="rhythm"
        onDanger={
          onRemove
            ? () => {
                onRemove();
                onClose();
              }
            : undefined
        }
        onDuplicate={
          onClone
            ? () => {
                onClone();
                onClose();
              }
            : undefined
        }
      />
    </ObjectMenuDialog>
  );
}
