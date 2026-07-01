"use client";

import { SwatchBook } from "lucide-react";
import { WoodSurfaceChoiceList } from "@/components/appearance/WoodSurfaceChoiceList";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import {
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import {
  DEFAULT_WOOD_SURFACE_ID,
  woodSurfaces,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";

type MenuChoice = "appearance";

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
        <DisclosureListItem
          ariaLabel={`Appearance. Current: ${woodSurfaces[wood].title}`}
          icon={<SwatchBook />}
          isOpen={isChoiceOpen("appearance")}
          label="Appearance"
          preview={<WoodSurfaceSwatch surfaceId={wood} />}
          panelVariant="menu"
          onToggle={() => toggleChoice("appearance")}
        >
          <WoodSurfaceChoiceList
            value={wood}
            onChange={(value) => onWoodChange?.(value)}
          />
        </DisclosureListItem>
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
