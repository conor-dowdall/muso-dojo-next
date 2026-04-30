"use client";

import { type ReactNode, useCallback, useId, useState } from "react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import styles from "./AddToMusicGroupDialog.module.css";

export function ChoiceAccordion({ children }: { children: ReactNode }) {
  return <div className={styles.setupRows}>{children}</div>;
}

export function ChoiceAccordionItem({
  ariaLabel,
  children,
  icon,
  isOpen,
  label,
  onToggle,
  preview,
  subtitle,
}: {
  ariaLabel: string;
  children: ReactNode;
  icon?: ReactNode;
  isOpen: boolean;
  label: ReactNode;
  onToggle: () => void;
  preview?: ReactNode;
  subtitle?: ReactNode;
}) {
  const panelId = useId();

  return (
    <>
      <OptionButton
        aria-label={ariaLabel}
        aria-controls={panelId}
        aria-expanded={isOpen}
        icon={icon}
        iconPosition={icon ? "end" : undefined}
        iconSizing={icon ? "content" : undefined}
        label={label}
        presentation="list"
        preview={preview}
        selected={isOpen}
        selectionSemantics="visual"
        showSelectionIndicator={false}
        subtitle={subtitle}
        onClick={onToggle}
      />

      {isOpen ? (
        <div id={panelId} className={styles.disclosurePanel}>
          {children}
        </div>
      ) : null}
    </>
  );
}

export function useChoiceAccordion<ChoiceKey extends string>(
  initialOpenChoice: ChoiceKey | null = null,
) {
  const [openChoice, setOpenChoice] = useState<ChoiceKey | null>(
    initialOpenChoice,
  );

  const toggleChoice = useCallback((choice: ChoiceKey) => {
    setOpenChoice((currentChoice) =>
      currentChoice === choice ? null : choice,
    );
  }, []);

  const closeChoice = useCallback((choice: ChoiceKey) => {
    setOpenChoice((currentChoice) =>
      currentChoice === choice ? null : currentChoice,
    );
  }, []);

  const closeAll = useCallback(() => {
    setOpenChoice(null);
  }, []);

  return {
    closeAll,
    closeChoice,
    openChoice,
    toggleChoice,
  };
}
