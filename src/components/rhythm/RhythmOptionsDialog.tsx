"use client";

import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";

export function RhythmOptionsDialog({
  isOpen,
  onClone,
  onClose,
  onRemove,
}: {
  isOpen: boolean;
  onClone?: () => void;
  onClose: () => void;
  onRemove?: () => void;
}) {
  return (
    <ObjectMenuDialog isOpen={isOpen} title="Rhythm Options" onClose={onClose}>
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
