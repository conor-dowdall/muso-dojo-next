import { useRef, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Dialog.module.css";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  "data-component"?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  "data-component": dataComponent = "Dialog",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
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
      data-component={dataComponent}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.content}>{children}</div>
    </dialog>
  );
}
