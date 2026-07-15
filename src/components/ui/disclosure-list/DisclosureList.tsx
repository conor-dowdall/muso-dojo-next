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
import { Button } from "@/components/ui/buttons/Button";
import {
  SelectionPreviewLabel,
  type SelectionPreviewKind,
} from "@/components/ui/selection-preview";
import styles from "./DisclosureList.module.css";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DivProps = Omit<ComponentPropsWithoutRef<"div">, "children">;

export type DisclosureListDensity = "comfortable" | "compact";
export type DisclosureListGroupGap = "related" | "section";
export type DisclosureListPanelVariant = "editor" | "menu";

function resolveSelectedPreview({
  preview,
  selected,
  selectedPreviewKind,
  selectedPreviewLabel,
}: {
  preview: ReactNode | undefined;
  selected: boolean;
  selectedPreviewKind: SelectionPreviewKind;
  selectedPreviewLabel: ReactNode | undefined;
}) {
  return selected && preview === undefined ? (
    <SelectionPreviewLabel kind={selectedPreviewKind}>
      {selectedPreviewLabel}
    </SelectionPreviewLabel>
  ) : (
    preview
  );
}

/**
 * Disclosure lists are scan surfaces for settings, choices, and object actions.
 * Keep labels stable, previews compact, and explanatory text in subtitles.
 */
interface DisclosureListProps extends DivProps {
  children: ReactNode;
  density?: DisclosureListDensity;
  groupGap?: DisclosureListGroupGap;
  grouped?: boolean;
}

export function DisclosureList({
  children,
  className = "",
  density = "comfortable",
  groupGap = "section",
  grouped = false,
  ...props
}: DisclosureListProps) {
  const listClasses = cx(styles.list, grouped && styles.groupedList, className);

  return (
    <div
      {...props}
      className={listClasses}
      data-density={density}
      data-group-gap={grouped ? groupGap : undefined}
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
  ariaCurrent?: ComponentPropsWithoutRef<"button">["aria-current"];
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  density?: OptionButtonProps["density"];
  disabled?: boolean;
  disclosureIndicator?: boolean;
  disclosureSemantics?: boolean;
  icon?: ReactNode;
  isOpen: boolean;
  keepMounted?: boolean;
  label: ReactNode;
  labelProps?: OptionButtonProps["labelProps"];
  onToggle: () => void;
  panelClassName?: string;
  panelContentClassName?: string;
  panelId?: string;
  panelVariant?: DisclosureListPanelVariant;
  preview?: ReactNode;
  selected?: boolean;
  subtitle?: ReactNode;
  tone?: OptionButtonProps["tone"];
  variant?: OptionButtonProps["variant"];
}

export function DisclosureListItem({
  ariaCurrent,
  ariaLabel,
  children,
  className = "",
  containerClassName = "",
  density,
  disabled,
  disclosureIndicator = true,
  disclosureSemantics = true,
  icon,
  isOpen,
  keepMounted = false,
  label,
  labelProps,
  onToggle,
  panelClassName,
  panelContentClassName,
  panelId,
  panelVariant,
  preview,
  selected,
  subtitle,
  tone,
  variant,
}: DisclosureListItemProps) {
  const generatedPanelId = useId();
  const resolvedPanelId = panelId ?? generatedPanelId;
  const clusterClasses = cx(styles.itemCluster, containerClassName);
  const itemClasses = cx(styles.item, className);
  const isSelected = selected ?? isOpen;
  const panelIsMounted = isOpen || keepMounted;
  const controlledPanelId =
    disclosureSemantics && panelIsMounted ? resolvedPanelId : undefined;

  return (
    <div className={clusterClasses}>
      <OptionButton
        aria-current={ariaCurrent}
        aria-label={ariaLabel}
        aria-controls={controlledPanelId}
        aria-expanded={disclosureSemantics ? isOpen : undefined}
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
        variant={panelVariant}
      >
        {children}
      </DisclosureListPanel>
    </div>
  );
}

type DisclosureListActionItemProps = Omit<
  DisclosureListItemProps,
  "disclosureIndicator" | "disclosureSemantics"
>;

/**
 * Object action row that reveals a local editor, such as Rename.
 */
export function DisclosureListActionItem({
  isOpen,
  selected,
  ...props
}: DisclosureListActionItemProps) {
  return (
    <DisclosureListItem
      {...props}
      disclosureIndicator={false}
      disclosureSemantics
      isOpen={isOpen}
      selected={selected ?? isOpen}
    />
  );
}

type DisclosureListActionProps = OptionButtonProps & {
  containerClassName?: string;
};

export function DisclosureListAction({
  className = "",
  containerClassName = "",
  ...props
}: DisclosureListActionProps) {
  const clusterClasses = cx(styles.itemCluster, containerClassName);
  const itemClasses = cx(styles.item, className);

  return (
    <div className={clusterClasses}>
      <OptionButton {...props} className={itemClasses} presentation="list" />
    </div>
  );
}

type DisclosureListChoiceProps = Omit<
  DisclosureListActionProps,
  "preview" | "selected"
> & {
  preview?: ReactNode;
  selected: boolean;
  selectedPreviewKind?: SelectionPreviewKind;
  selectedPreviewLabel?: ReactNode;
};

export function DisclosureListChoice({
  preview,
  selected,
  selectedPreviewKind = "selected",
  selectedPreviewLabel,
  ...props
}: DisclosureListChoiceProps) {
  const resolvedPreview = resolveSelectedPreview({
    preview,
    selected,
    selectedPreviewKind,
    selectedPreviewLabel,
  });

  return (
    <DisclosureListAction
      {...props}
      preview={resolvedPreview}
      selected={selected}
    />
  );
}

type DisclosureListChoiceItemProps = Omit<
  DisclosureListItemProps,
  "preview" | "selected"
> & {
  preview?: ReactNode;
  selected: boolean;
  selectedPreviewKind?: SelectionPreviewKind;
  selectedPreviewLabel?: ReactNode;
};

export function DisclosureListChoiceItem({
  preview,
  selected,
  selectedPreviewKind = "selected",
  selectedPreviewLabel,
  ...props
}: DisclosureListChoiceItemProps) {
  const resolvedPreview = resolveSelectedPreview({
    preview,
    selected,
    selectedPreviewKind,
    selectedPreviewLabel,
  });

  return (
    <DisclosureListItem
      {...props}
      preview={resolvedPreview}
      selected={selected}
    />
  );
}

interface DisclosureListConfirmActionProps {
  actionAriaLabel?: string;
  cancelLabel?: string;
  className?: string;
  confirmAriaLabel: string;
  confirmLabel: ReactNode;
  confirmLabelClassName?: string;
  confirmButtonLabel?: string;
  containerClassName?: string;
  icon?: ReactNode;
  isConfirming: boolean;
  label: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  onRequestConfirm: () => void;
  tone?: OptionButtonProps["tone"];
}

export function DisclosureListConfirmAction({
  actionAriaLabel,
  cancelLabel = "Cancel",
  className = "",
  confirmAriaLabel,
  confirmLabel,
  confirmLabelClassName = "",
  confirmButtonLabel = "Confirm",
  containerClassName = "",
  icon,
  isConfirming,
  label,
  onCancel,
  onConfirm,
  onRequestConfirm,
  tone = "neutral",
}: DisclosureListConfirmActionProps) {
  const clusterClasses = cx(styles.itemCluster, containerClassName);
  const confirmationClasses = cx(styles.confirmation, className);
  const labelClasses = cx(styles.confirmationLabel, confirmLabelClassName);

  if (!isConfirming) {
    return (
      <DisclosureListAction
        aria-label={actionAriaLabel}
        containerClassName={containerClassName}
        icon={icon}
        label={label}
        tone={tone}
        onClick={onRequestConfirm}
      />
    );
  }

  return (
    <div className={clusterClasses}>
      <div
        aria-label={confirmAriaLabel}
        className={confirmationClasses}
        data-tone={tone}
        role="group"
      >
        <span className={styles.confirmationHeader}>
          {icon !== undefined ? (
            <span className={styles.confirmationIcon} aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className={labelClasses}>{confirmLabel}</span>
        </span>
        <span className={styles.confirmationActions}>
          <Button label={cancelLabel} size="sm" onClick={onCancel} />
          <Button
            label={confirmButtonLabel}
            preventConcurrentClicks
            size="sm"
            tone={tone}
            onClick={onConfirm}
          />
        </span>
      </div>
    </div>
  );
}

interface DisclosureListPanelProps extends DivProps {
  children: ReactNode;
  contentClassName?: string;
  isOpen?: boolean;
  keepMounted?: boolean;
  variant?: DisclosureListPanelVariant;
}

export function DisclosureListPanel({
  children,
  className = "",
  contentClassName = "",
  id,
  isOpen = true,
  keepMounted = false,
  variant = "editor",
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
      data-variant={variant}
      inert={isOpen ? undefined : true}
    >
      <div className={contentClasses}>{children}</div>
    </div>
  );
}

interface DisclosureListPanelActionsProps extends DivProps {
  align?: "start" | "end" | "stretch";
  children: ReactNode;
}

/**
 * Local inline editor actions. Dialog-level decisions belong in DialogFooter.
 */
export function DisclosureListPanelActions({
  align = "end",
  children,
  className = "",
  ...props
}: DisclosureListPanelActionsProps) {
  const actionsClasses = cx(styles.panelActions, className);

  return (
    <div {...props} className={actionsClasses} data-align={align}>
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
