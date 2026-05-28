"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { DisclosureList } from "@/components/ui/disclosure-list/DisclosureList";
import { getObjectMenuTitle, type ObjectMenuLevel } from "./objectMenuCopy";
import styles from "./ObjectMenuDialog.module.css";

interface ObjectMenuDialogProps {
  children: ReactNode;
  contentClassName?: string;
  isOpen: boolean;
  level: ObjectMenuLevel;
  listClassName?: string;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  title?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ObjectMenuDialog({
  children,
  contentClassName,
  isOpen,
  level,
  listClassName,
  onClose,
  size = "md",
  title,
}: ObjectMenuDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} size={size}>
      <DialogHeader
        title={title ?? getObjectMenuTitle(level)}
        onClose={onClose}
      />
      <DialogContent className={cx(styles.menuContent, contentClassName)}>
        <DisclosureList className={listClassName} grouped groupGap="section">
          {children}
        </DisclosureList>
      </DialogContent>
      <DialogFooter className={styles.menuFooter}>
        <section className={styles.footerActions} aria-label="Dialog actions">
          <Button label="Done" size="lg" variant="filled" onClick={onClose} />
        </section>
      </DialogFooter>
    </Dialog>
  );
}
