"use client";

import { type ReactNode, type RefObject } from "react";
import {
  Dialog,
  DialogCloseFooter,
  DialogContent,
  DialogHeader,
  type DialogSize,
} from "@/components/ui/dialog/Dialog";
import { DisclosureList } from "@/components/ui/disclosure-list/DisclosureList";

interface ObjectMenuDialogProps {
  children: ReactNode;
  closeImmediately?: boolean;
  contentClassName?: string;
  isOpen: boolean;
  footer?: ReactNode;
  icon?: ReactNode;
  listClassName?: string;
  onClose: () => void;
  onAfterClose?: () => void;
  restoreFocusOnClose?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  returnFocusTo?: HTMLElement | null;
  size?: DialogSize;
  title: ReactNode;
}

export function ObjectMenuDialog({
  children,
  closeImmediately,
  contentClassName,
  isOpen,
  footer,
  icon,
  listClassName,
  onClose,
  onAfterClose,
  restoreFocusOnClose,
  returnFocusRef,
  returnFocusTo,
  size = "standard",
  title,
}: ObjectMenuDialogProps) {
  return (
    <Dialog
      closeImmediately={closeImmediately}
      isOpen={isOpen}
      onAfterClose={onAfterClose}
      onClose={onClose}
      restoreFocusOnClose={restoreFocusOnClose}
      returnFocusRef={returnFocusRef}
      returnFocusTo={returnFocusTo}
      size={size}
    >
      <DialogHeader icon={icon} title={title} onClose={onClose} />
      <DialogContent className={contentClassName} menuRhythm="compact">
        <DisclosureList className={listClassName} grouped groupGap="section">
          {children}
        </DisclosureList>
      </DialogContent>
      {footer ?? <DialogCloseFooter onClose={onClose} />}
    </Dialog>
  );
}
