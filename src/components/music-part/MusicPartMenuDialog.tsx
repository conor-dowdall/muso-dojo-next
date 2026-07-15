"use client";

import { Ellipsis } from "lucide-react";
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
    <ObjectMenuDialog
      icon={<Ellipsis />}
      isOpen={isOpen}
      size="compact"
      title="Part Actions"
      onClose={onClose}
    >
      <ObjectManagementGroup
        kind="part"
        onDanger={musicPart.removePart ? handleRemove : undefined}
        onDuplicate={musicPart.clonePart ? handleClone : undefined}
      />
    </ObjectMenuDialog>
  );
}
