"use client";

import { type ReactNode, useCallback, useId, useState } from "react";
import {
  OptionButton,
  type OptionButtonProps,
} from "@/components/ui/buttons/OptionButton";
import styles from "./DisclosureList.module.css";

/**
 * Shared vertical menu pattern for object rows, action rows, and nested editors.
 * Panels can stay mounted for calmer transitions while inert keeps closed inputs
 * out of the focus order.
 */
export function DisclosureList({
  children,
  className = "",
  grouped = false,
}: {
  children: ReactNode;
  className?: string;
  grouped?: boolean;
}) {
  const listClasses = [
    styles.list,
    grouped ? styles.groupedList : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={listClasses}>{children}</div>;
}

export function DisclosureListGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const groupClasses = [styles.group, className].filter(Boolean).join(" ");

  return <div className={groupClasses}>{children}</div>;
}

interface DisclosureListItemProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  density?: OptionButtonProps["density"];
  disabled?: boolean;
  disclosureIndicator?: boolean;
  icon?: ReactNode;
  isOpen: boolean;
  keepMounted?: boolean;
  label: ReactNode;
  labelProps?: OptionButtonProps["labelProps"];
  onToggle: () => void;
  preview?: ReactNode;
  selected?: boolean;
  showSelectionIndicator?: OptionButtonProps["showSelectionIndicator"];
  subtitle?: ReactNode;
  tone?: OptionButtonProps["tone"];
  variant?: OptionButtonProps["variant"];
}

export function DisclosureListItem({
  ariaLabel,
  children,
  className = "",
  density,
  disabled,
  disclosureIndicator = true,
  icon,
  isOpen,
  keepMounted = false,
  label,
  labelProps,
  onToggle,
  preview,
  selected,
  showSelectionIndicator,
  subtitle,
  tone,
  variant,
}: DisclosureListItemProps) {
  const panelId = useId();
  const itemClasses = [styles.item, className].filter(Boolean).join(" ");
  const isSelected = selected ?? isOpen;

  return (
    <>
      <OptionButton
        aria-label={ariaLabel}
        aria-controls={panelId}
        aria-expanded={isOpen}
        className={itemClasses}
        density={density}
        disabled={disabled}
        disclosureState={
          disclosureIndicator ? (isOpen ? "open" : "closed") : undefined
        }
        icon={icon}
        label={label}
        labelProps={labelProps}
        presentation="list"
        preview={preview}
        selected={isSelected}
        selectionSemantics="visual"
        showSelectionIndicator={showSelectionIndicator ?? false}
        subtitle={subtitle}
        tone={tone}
        variant={variant}
        onClick={onToggle}
      />

      <DisclosureListPanel
        id={panelId}
        isOpen={isOpen}
        keepMounted={keepMounted}
      >
        {children}
      </DisclosureListPanel>
    </>
  );
}

export function DisclosureListAction({
  className = "",
  showSelectionIndicator = false,
  ...props
}: OptionButtonProps) {
  const itemClasses = [styles.item, className].filter(Boolean).join(" ");

  return (
    <OptionButton
      {...props}
      className={itemClasses}
      presentation="list"
      showSelectionIndicator={showSelectionIndicator}
    />
  );
}

export function DisclosureListPanel({
  children,
  className = "",
  id,
  isOpen = true,
  keepMounted = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  isOpen?: boolean;
  keepMounted?: boolean;
}) {
  if (!isOpen && !keepMounted) {
    return null;
  }

  const panelClasses = [styles.panel, className].filter(Boolean).join(" ");

  return (
    <div
      id={id}
      aria-hidden={isOpen ? undefined : true}
      className={panelClasses}
      data-state={isOpen ? "open" : "closed"}
      inert={isOpen ? undefined : true}
    >
      <div className={styles.panelInner}>{children}</div>
    </div>
  );
}

export function useDisclosureList<ChoiceKey extends string>(
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
