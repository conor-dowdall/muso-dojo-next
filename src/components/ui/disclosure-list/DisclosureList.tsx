"use client";

import { type ReactNode, useCallback, useId, useState } from "react";
import {
  OptionButton,
  type OptionButtonProps,
} from "@/components/ui/buttons/OptionButton";
import styles from "./DisclosureList.module.css";

export function DisclosureList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const listClasses = [styles.list, className].filter(Boolean).join(" ");

  return <div className={listClasses}>{children}</div>;
}

interface DisclosureListItemProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  density?: OptionButtonProps["density"];
  disabled?: boolean;
  icon?: ReactNode;
  isOpen: boolean;
  label: ReactNode;
  labelProps?: OptionButtonProps["labelProps"];
  onToggle: () => void;
  preview?: ReactNode;
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
  icon,
  isOpen,
  label,
  labelProps,
  onToggle,
  preview,
  subtitle,
  tone,
  variant,
}: DisclosureListItemProps) {
  const panelId = useId();
  const itemClasses = [styles.item, className].filter(Boolean).join(" ");

  return (
    <>
      <OptionButton
        aria-label={ariaLabel}
        aria-controls={panelId}
        aria-expanded={isOpen}
        className={itemClasses}
        density={density}
        disabled={disabled}
        icon={icon}
        label={label}
        labelProps={labelProps}
        presentation="list"
        preview={preview}
        selected={isOpen}
        selectionSemantics="visual"
        showSelectionIndicator={false}
        subtitle={subtitle}
        tone={tone}
        variant={variant}
        onClick={onToggle}
      />

      {isOpen ? (
        <DisclosureListPanel id={panelId}>{children}</DisclosureListPanel>
      ) : null}
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
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const panelClasses = [styles.panel, className].filter(Boolean).join(" ");

  return (
    <div id={id} className={panelClasses}>
      {children}
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
