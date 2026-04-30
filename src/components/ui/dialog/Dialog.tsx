import { useRef, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Dialog.module.css";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Heading } from "@/components/ui/typography/Heading";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  children,
  size = "md",
  className = "",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // We persist the children to ensure the dialog stays "full" during
  // its final frame on screen, before the exit animation closes it.
  const [persistedChildren, setPersistedChildren] =
    useState<ReactNode>(children);
  const [persistedSize, setPersistedSize] = useState(size);

  // We only update the persisted "memory" while the dialog is open. When
  // closing, we keep the last valid content and size so it doesn't collapse.
  if (isOpen && children && children !== persistedChildren) {
    setPersistedChildren(children);
  }

  if (isOpen && size !== persistedSize) {
    setPersistedSize(size);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${className}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      onAnimationEnd={(e) => {
        if (
          e.target === dialogRef.current &&
          !isOpen &&
          dialogRef.current?.open
        ) {
          dialogRef.current?.close();
        }
      }}
      data-state={isOpen ? undefined : "closing"}
      data-size={isOpen ? size : persistedSize}
    >
      {isOpen ? children : persistedChildren}
    </dialog>
  );
}

interface DialogHeaderProps {
  title: string;
  onClose?: () => void;
  className?: string;
}

export function DialogHeader({
  title,
  onClose,
  className = "",
}: DialogHeaderProps) {
  return (
    <header className={`${styles.dialogHeader} ${className}`}>
      <Heading as="h2" className={styles.dialogTitle} leading="none">
        {title}
      </Heading>
      {onClose ? (
        <IconButton
          aria-label="Close dialog"
          icon={<X />}
          size="sm"
          tooltip={false}
          variant="ghost"
          onClick={onClose}
          shouldYield={false}
        />
      ) : null}
    </header>
  );
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export function DialogContent({
  children,
  className = "",
}: DialogContentProps) {
  return <div className={`${styles.content} ${className}`}>{children}</div>;
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className = "" }: DialogFooterProps) {
  return (
    <footer className={`${styles.dialogFooter} ${className}`}>
      {children}
    </footer>
  );
}
