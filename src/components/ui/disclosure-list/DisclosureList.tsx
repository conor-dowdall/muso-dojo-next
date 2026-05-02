"use client";

import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useCallback,
  useId,
  useState,
} from "react";
import {
  OptionButton,
  type OptionButtonProps,
} from "@/components/ui/buttons/OptionButton";
import styles from "./DisclosureList.module.css";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DivProps = Omit<ComponentPropsWithoutRef<"div">, "children">;

export type DisclosureListDensity = "comfortable" | "compact";

/**
 * Shared vertical menu pattern for object rows, action rows, and nested editors.
 * Panels can stay mounted for calmer transitions while inert keeps closed inputs
 * out of the focus order.
 */
interface DisclosureListProps extends DivProps {
  children: ReactNode;
  density?: DisclosureListDensity;
  grouped?: boolean;
}

export function DisclosureList({
  children,
  className = "",
  density = "comfortable",
  grouped = false,
  ...props
}: DisclosureListProps) {
  const listClasses = cx(styles.list, grouped && styles.groupedList, className);

  return (
    <div
      {...props}
      className={listClasses}
      data-density={density}
      data-grouped={grouped ? true : undefined}
    >
      {children}
    </div>
  );
}

interface DisclosureListGroupProps extends DivProps {
  children: ReactNode;
}

export function DisclosureListGroup({
  children,
  className = "",
  ...props
}: DisclosureListGroupProps) {
  const groupClasses = cx(styles.group, className);

  return (
    <div {...props} className={groupClasses}>
      {children}
    </div>
  );
}

interface DisclosureListItemProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  density?: OptionButtonProps["density"];
  disabled?: boolean;
  disclosureIndicator?: boolean;
  icon?: ReactNode;
  isOpen: boolean;
  keepMounted?: boolean;
  label: ReactNode;
  labelProps?: OptionButtonProps["labelProps"];
  onToggle: () => void;
  panelClassName?: string;
  panelContentClassName?: string;
  panelId?: string;
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
  containerClassName = "",
  density,
  disabled,
  disclosureIndicator = true,
  icon,
  isOpen,
  keepMounted = false,
  label,
  labelProps,
  onToggle,
  panelClassName,
  panelContentClassName,
  panelId,
  preview,
  selected,
  showSelectionIndicator,
  subtitle,
  tone,
  variant,
}: DisclosureListItemProps) {
  const generatedPanelId = useId();
  const resolvedPanelId = panelId ?? generatedPanelId;
  const clusterClasses = cx(styles.itemCluster, containerClassName);
  const itemClasses = cx(styles.item, className);
  const isSelected = selected ?? isOpen;

  return (
    <div className={clusterClasses}>
      <OptionButton
        aria-label={ariaLabel}
        aria-controls={resolvedPanelId}
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
        className={panelClassName}
        contentClassName={panelContentClassName}
        id={resolvedPanelId}
        isOpen={isOpen}
        keepMounted={keepMounted}
      >
        {children}
      </DisclosureListPanel>
    </div>
  );
}

type DisclosureListActionProps = OptionButtonProps & {
  containerClassName?: string;
};

export function DisclosureListAction({
  className = "",
  containerClassName = "",
  showSelectionIndicator = false,
  ...props
}: DisclosureListActionProps) {
  const clusterClasses = cx(styles.itemCluster, containerClassName);
  const itemClasses = cx(styles.item, className);

  return (
    <div className={clusterClasses}>
      <OptionButton
        {...props}
        className={itemClasses}
        presentation="list"
        showSelectionIndicator={showSelectionIndicator}
      />
    </div>
  );
}

interface DisclosureListPanelProps extends DivProps {
  children: ReactNode;
  contentClassName?: string;
  isOpen?: boolean;
  keepMounted?: boolean;
}

export function DisclosureListPanel({
  children,
  className = "",
  contentClassName = "",
  id,
  isOpen = true,
  keepMounted = false,
  ...props
}: DisclosureListPanelProps) {
  if (!isOpen && !keepMounted) {
    return null;
  }

  const panelClasses = cx(styles.panel, className);
  const contentClasses = cx(styles.panelInner, contentClassName);

  return (
    <div
      {...props}
      id={id}
      aria-hidden={isOpen ? undefined : true}
      className={panelClasses}
      data-state={isOpen ? "open" : "closed"}
      inert={isOpen ? undefined : true}
    >
      <div className={contentClasses}>{children}</div>
    </div>
  );
}

export function useDisclosureList<ChoiceKey extends string>(
  initialOpenChoice: ChoiceKey | null = null,
) {
  const [openChoice, setOpenChoice] = useState<ChoiceKey | null>(
    initialOpenChoice,
  );

  const open = useCallback((choice: ChoiceKey) => {
    setOpenChoice(choice);
  }, []);

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

  const isOpen = useCallback(
    (choice: ChoiceKey) => openChoice === choice,
    [openChoice],
  );

  return {
    closeAll,
    closeChoice,
    isOpen,
    open,
    openChoice,
    setOpenChoice,
    toggleChoice,
  };
}
