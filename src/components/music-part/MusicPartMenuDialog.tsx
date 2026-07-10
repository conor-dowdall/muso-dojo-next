"use client";

import { useState } from "react";
import { Timer } from "lucide-react";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  formatPartLengthBeats,
  USER_PART_LENGTH_BEAT_CHOICES,
} from "@/utils/music-part/partLength";
import { useMusicPart } from "./MusicPartContext";

interface MusicPartMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MusicPartMenuDialog({
  isOpen,
  onClose,
}: MusicPartMenuDialogProps) {
  const musicPart = useMusicPart();
  const [lengthOpen, setLengthOpen] = useState(false);

  const handleClone = () => {
    musicPart.clonePart?.();
    onClose();
  };

  const handleRemove = () => {
    musicPart.removePart?.();
    onClose();
  };

  return (
    <ObjectMenuDialog
      isOpen={isOpen}
      size="compact"
      title="Part Actions"
      onClose={onClose}
    >
      {musicPart.setLengthBeats ? (
        <DisclosureListGroup>
          <DisclosureListItem
            ariaLabel={`Choose Part Length. Current: ${formatPartLengthBeats(musicPart.lengthBeats)}`}
            icon={<Timer />}
            isOpen={lengthOpen}
            label="Part Length"
            panelVariant="menu"
            preview={formatPartLengthBeats(musicPart.lengthBeats)}
            subtitle="How long the Practice Band stays on this Part"
            onToggle={() => setLengthOpen((open) => !open)}
          >
            <DisclosureList density="compact">
              {USER_PART_LENGTH_BEAT_CHOICES.map((lengthBeats) => (
                <DisclosureListChoice
                  key={lengthBeats}
                  label={formatPartLengthBeats(lengthBeats)}
                  selected={musicPart.lengthBeats === lengthBeats}
                  selectedPreviewKind="current"
                  onClick={() => {
                    musicPart.setLengthBeats?.(lengthBeats);
                    setLengthOpen(false);
                  }}
                />
              ))}
            </DisclosureList>
          </DisclosureListItem>
        </DisclosureListGroup>
      ) : null}
      <ObjectManagementGroup
        kind="part"
        onDanger={musicPart.removePart ? handleRemove : undefined}
        onDuplicate={musicPart.clonePart ? handleClone : undefined}
      />
    </ObjectMenuDialog>
  );
}
