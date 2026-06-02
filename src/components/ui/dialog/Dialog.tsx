import { useRef, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Dialog.module.css";
import { Button, type ButtonProps } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Heading } from "@/components/ui/typography/Heading";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

let lockedDialogCount = 0;
let previousBodyOverflow = "";
let previousBodyPaddingInlineEnd = "";

function lockBodyScroll() {
  if (lockedDialogCount === 0) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingInlineEnd = document.body.style.paddingInlineEnd;

    if (scrollbarWidth > 0) {
      document.body.style.paddingInlineEnd = previousBodyPaddingInlineEnd
        ? `calc(${previousBodyPaddingInlineEnd} + ${scrollbarWidth}px)`
        : `${scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";
  }

  lockedDialogCount += 1;

  return () => {
    lockedDialogCount = Math.max(0, lockedDialogCount - 1);

    if (lockedDialogCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingInlineEnd = previousBodyPaddingInlineEnd;
      previousBodyOverflow = "";
      previousBodyPaddingInlineEnd = "";
    }
  };
}

/**
 * Dialog width convention:
 * - compact: single small picker or tiny action surface.
 * - standard: settings, options, libraries, and ordinary menus.
 * - wide: creation/composition flows with several configuration sections.
 */
export type DialogSize = "compact" | "standard" | "wide";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: DialogSize;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  children,
  size = "standard",
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return lockBodyScroll();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={cx(styles.dialog, className)}
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
  /**
   * !!! LLM COPY CONVENTION: Dialog titles are headings.
   * Use Title Case, leaving minor words lowercase unless first/last:
   * "Instrument Options", "Part Actions", "Add to Session".
   */
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
    <header className={cx(styles.dialogHeader, className)}>
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

type DialogContentLayout = "plain" | "stack";
type DialogMenuRhythm = "standard" | "compact";

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  layout?: DialogContentLayout;
  menuRhythm?: DialogMenuRhythm;
}

/**
 * Use menuRhythm for DisclosureList-based dialog surfaces so menu spacing is
 * chosen at the dialog boundary instead of recreated in local CSS modules.
 */
export function DialogContent({
  children,
  className = "",
  layout = "plain",
  menuRhythm,
}: DialogContentProps) {
  return (
    <div
      className={cx(styles.content, className)}
      data-layout={layout === "plain" ? undefined : layout}
      data-menu-rhythm={menuRhythm}
    >
      {children}
    </div>
  );
}

interface DialogContentSectionProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
}

export function DialogContentSection({
  ariaLabel,
  children,
  className = "",
}: DialogContentSectionProps) {
  return (
    <section
      className={cx(styles.contentSection, className)}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * !!! LLM COPY CONVENTION: Use DialogFooter for dialog-level decisions.
 * Add a Done footer when menu/settings/management choices apply immediately
 * and the user needs an obvious close affordance. Omit Done when the footer
 * already has a primary commit/cancel flow, such as Add/Cancel. Local inline
 * editor Done buttons belong in DisclosureListPanelActions instead. Use
 * DialogDoneFooter for the standard immediate-apply Done footer.
 */
export function DialogFooter({ children, className = "" }: DialogFooterProps) {
  return (
    <footer className={cx(styles.dialogFooter, className)}>{children}</footer>
  );
}

interface DialogFooterActionBarProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
}

export function DialogFooterActionBar({
  ariaLabel = "Dialog actions",
  children,
  className = "",
}: DialogFooterActionBarProps) {
  return (
    <section
      className={cx(styles.dialogFooterActionBar, className)}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}

interface DialogFooterActionGroupProps {
  children: ReactNode;
  className?: string;
  placement?: "primary" | "secondary";
}

export function DialogFooterActionGroup({
  children,
  className = "",
  placement = "primary",
}: DialogFooterActionGroupProps) {
  return (
    <div
      className={cx(styles.dialogFooterActionGroup, className)}
      data-placement={placement}
    >
      {children}
    </div>
  );
}

interface DialogDoneFooterProps {
  buttonSize?: ButtonProps["size"];
  className?: string;
  label?: string;
  onDone: () => void;
}

export function DialogDoneFooter({
  buttonSize = "lg",
  className = "",
  label = "Done",
  onDone,
}: DialogDoneFooterProps) {
  return (
    <DialogFooter className={className}>
      <section
        className={styles.dialogFooterActions}
        aria-label="Dialog actions"
      >
        <Button
          label={label}
          size={buttonSize}
          variant="filled"
          onClick={onDone}
        />
      </section>
    </DialogFooter>
  );
}
