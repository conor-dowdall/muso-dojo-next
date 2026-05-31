"use client";

import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
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
      <ObjectManagementGroup
        level="part"
        onDanger={musicPart.removePart ? handleRemove : undefined}
        onDuplicate={musicPart.clonePart ? handleClone : undefined}
      />
    </ObjectMenuDialog>
  );
}
