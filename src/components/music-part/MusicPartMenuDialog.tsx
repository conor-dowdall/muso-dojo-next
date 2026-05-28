"use client";

import { type ReactNode } from "react";
import { Columns2, Rows3 } from "lucide-react";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import { type MusicPartLayout } from "@/types/music-part";
import { useMusicPart } from "./MusicPartContext";

interface MusicPartMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type PartMenuChoice = "layout";

const layoutOptions = [
  {
    layout: "column",
    ariaLabel: "Stack instruments in this part",
    label: "Stack",
    icon: <Rows3 />,
  },
  {
    layout: "row",
    ariaLabel: "Show instruments side by side in this part",
    label: "Side by Side",
    icon: <Columns2 />,
  },
] as const satisfies readonly {
  ariaLabel: string;
  icon: ReactNode;
  label: string;
  layout: MusicPartLayout;
}[];

function getLayoutLabel(layout: MusicPartLayout) {
  return layoutOptions.find((option) => option.layout === layout)?.label;
}

function getLayoutIcon(layout: MusicPartLayout) {
  return layoutOptions.find((option) => option.layout === layout)?.icon;
}

export function MusicPartMenuDialog({
  isOpen,
  onClose,
}: MusicPartMenuDialogProps) {
  const musicPart = useMusicPart();
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<PartMenuChoice>();
  const setLayout = musicPart.setLayout;
  const layoutLabel = getLayoutLabel(musicPart.layout) ?? "Stack";
  const layoutIcon = getLayoutIcon(musicPart.layout) ?? <Rows3 />;

  const handleLayoutSelect = (layout: MusicPartLayout) => {
    setLayout?.(layout);
    onClose();
  };

  const handleClone = () => {
    musicPart.clonePart?.();
    onClose();
  };

  const handleRemove = () => {
    musicPart.removePart?.();
    onClose();
  };

  return (
    <ObjectMenuDialog isOpen={isOpen} level="part" onClose={onClose}>
      {setLayout ? (
        <DisclosureListGroup>
          <DisclosureListItem
            ariaLabel={`Part layout. Current: ${layoutLabel}`}
            icon={layoutIcon}
            isOpen={isChoiceOpen("layout")}
            label="Layout"
            onToggle={() => toggleChoice("layout")}
            panelVariant="menu"
            preview={layoutLabel}
          >
            <DisclosureList density="compact">
              {layoutOptions.map((option) => (
                <DisclosureListChoice
                  key={option.layout}
                  aria-label={option.ariaLabel}
                  icon={option.icon}
                  label={option.label}
                  selected={musicPart.layout === option.layout}
                  onClick={() => handleLayoutSelect(option.layout)}
                />
              ))}
            </DisclosureList>
          </DisclosureListItem>
        </DisclosureListGroup>
      ) : null}

      <ObjectManagementGroup
        level="part"
        onDanger={musicPart.removePart ? handleRemove : undefined}
        onDuplicate={musicPart.clonePart ? handleClone : undefined}
      />
    </ObjectMenuDialog>
  );
}
