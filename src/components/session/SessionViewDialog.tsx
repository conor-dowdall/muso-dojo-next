"use client";

import { GalleryThumbnails } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { type SessionViewMode } from "./sessionViewMode";
import { SessionViewChoices } from "./SessionViewChoices";

export function SessionViewDialog({
  canUsePartViews,
  isOpen,
  onClose,
  onSelect,
  viewMode,
}: {
  canUsePartViews: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: SessionViewMode) => void;
  viewMode: SessionViewMode;
}) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="compact">
      <DialogHeader
        icon={<GalleryThumbnails />}
        title="View"
        onClose={onClose}
      />
      <DialogContent menuRhythm="compact">
        <SessionViewChoices
          canUsePartViews={canUsePartViews}
          viewMode={viewMode}
          onSelect={onSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
