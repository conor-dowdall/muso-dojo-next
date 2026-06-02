"use client";

import { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDoneFooter,
  DialogHeader,
  type DialogSize,
} from "@/components/ui/dialog/Dialog";
import { DisclosureList } from "@/components/ui/disclosure-list/DisclosureList";

interface ObjectMenuDialogProps {
  children: ReactNode;
  contentClassName?: string;
  isOpen: boolean;
  listClassName?: string;
  onClose: () => void;
  size?: DialogSize;
  title: string;
}

export function ObjectMenuDialog({
  children,
  contentClassName,
  isOpen,
  listClassName,
  onClose,
  size = "standard",
  title,
}: ObjectMenuDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} size={size}>
      <DialogHeader title={title} onClose={onClose} />
      <DialogContent className={contentClassName} menuRhythm="compact">
        <DisclosureList className={listClassName} grouped groupGap="section">
          {children}
        </DisclosureList>
      </DialogContent>
      <DialogDoneFooter onDone={onClose} />
    </Dialog>
  );
}
