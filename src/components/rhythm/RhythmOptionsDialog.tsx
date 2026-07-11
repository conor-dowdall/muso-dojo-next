"use client";

import { SwatchBook } from "lucide-react";
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
type MenuChoice = "wood";

export function RhythmOptionsDialog({
  isOpen,
  onClone,
  onClose,
  onRemove,
  onWoodChange,
  wood = DEFAULT_WOOD_SURFACE_ID,
}: {
  isOpen: boolean;
  onClone?: () => void;
  onClose: () => void;
  onRemove?: () => void;
  onWoodChange?: (value: WoodSurfaceId) => void;
  wood?: WoodSurfaceId;
}) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<MenuChoice>(null);

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Rhythm Options" onClose={onClose}>
      <DisclosureListGroup>
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
