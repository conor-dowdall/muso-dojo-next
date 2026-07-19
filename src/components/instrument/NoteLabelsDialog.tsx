"use client";

import { CaseSensitive } from "lucide-react";
import { DisplayFormatPicker } from "@/components/music-theory/DisplayFormatPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";

export function NoteLabelsDialog({
  displayFormatId,
  isOpen,
  onClose,
  onDisplayFormatIdChange,
}: {
  displayFormatId: DisplayFormatId;
  isOpen: boolean;
  onClose: () => void;
  onDisplayFormatIdChange: DisplayFormatSetter;
}) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="compact">
      <DialogHeader
        icon={<CaseSensitive />}
        title="Note Labels"
        onClose={onClose}
      />
      <DialogContent>
        <DisplayFormatPicker
          value={displayFormatId}
          onChange={(nextDisplayFormatId) => {
            onDisplayFormatIdChange(nextDisplayFormatId);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
