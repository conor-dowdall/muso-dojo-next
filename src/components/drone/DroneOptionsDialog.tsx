"use client";

import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";

interface DroneOptionsDialogProps {
  isOpen: boolean;
  onClone?: () => void;
  onClose: () => void;
  onRemove?: () => void;
}

export function DroneOptionsDialog({
  isOpen,
  onClone,
  onClose,
  onRemove,
}: DroneOptionsDialogProps) {
  const handleClone = () => {
    onClone?.();
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  return (
    <ObjectMenuDialog isOpen={isOpen} title="Drone Options" onClose={onClose}>
      <ObjectManagementGroup
        kind="drone"
        onDuplicate={onClone ? handleClone : undefined}
        onDanger={onRemove ? handleRemove : undefined}
      />
    </ObjectMenuDialog>
  );
}
