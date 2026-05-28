"use client";

import { type ReactNode } from "react";
import { Columns2, LayoutGrid, Rows3 } from "lucide-react";
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
    subtitle: "One instrument per row.",
    icon: <Rows3 />,
  },
  {
    layout: "row",
    ariaLabel: "Show instruments side by side in this part",
    label: "Side by Side",
    subtitle: "Fits instruments beside each other when there is room.",
    icon: <Columns2 />,
  },
] as const satisfies readonly {
  ariaLabel: string;
  icon: ReactNode;
  label: string;
  layout: MusicPartLayout;
  subtitle: string;
}[];

function getLayoutLabel(layout: MusicPartLayout) {
  return layoutOptions.find((option) => option.layout === layout)?.label;
}

export function MusicPartMenuDialog({
  isOpen,
  onClose,
}: MusicPartMenuDialogProps) {
  const musicPart = useMusicPart();
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<PartMenuChoice>();
  const setLayout = musicPart.setLayout;
  const canChooseLayout = setLayout !== undefined && musicPart.moduleCount > 1;
  const layoutLabel = getLayoutLabel(musicPart.layout) ?? "Stack";
  const layoutSupportCopy = "Applies when this part has multiple instruments.";
  const layoutAriaLabel = canChooseLayout
    ? `Part layout. Current: ${layoutLabel}`
    : `Part layout. Current: ${layoutLabel}. ${layoutSupportCopy}`;

  const handleLayoutSelect = (layout: MusicPartLayout) => {
    if (!canChooseLayout) {
      return;
    }

    setLayout(layout);
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
            ariaLabel={layoutAriaLabel}
            disabled={!canChooseLayout}
            icon={<LayoutGrid />}
            isOpen={canChooseLayout ? isChoiceOpen("layout") : false}
            label="Layout"
            onToggle={() => {
              if (canChooseLayout) {
                toggleChoice("layout");
              }
            }}
            panelVariant="menu"
            preview={layoutLabel}
            subtitle={!canChooseLayout ? layoutSupportCopy : undefined}
          >
            <DisclosureList density="compact">
              {layoutOptions.map((option) => (
                <DisclosureListChoice
                  key={option.layout}
                  aria-label={option.ariaLabel}
                  icon={option.icon}
                  label={option.label}
                  selected={musicPart.layout === option.layout}
                  subtitle={option.subtitle}
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
