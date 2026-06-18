"use client";

import { type ComponentPropsWithoutRef, type ReactNode, useId } from "react";
import { MoreHorizontal } from "lucide-react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  DisclosureListPanel,
  type DisclosureListPanelVariant,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  IconButton,
  type IconButtonProps,
} from "@/components/ui/buttons/IconButton";
import {
  SelectionPreviewLabel,
  type SelectionPreviewKind,
} from "@/components/ui/selection-preview";
import styles from "./SelectableOverflowRow.module.css";

export interface SelectableActionRowProps {
  actionControls?: string;
  actionDisabled?: boolean;
  actionExpanded?: boolean;
  actionIcon?: ReactNode;
  actionLabel?: string;
  actionSelected?: boolean;
  actionSize?: IconButtonProps["size"];
  actionVariant?: IconButtonProps["variant"];
  children?: ReactNode;
  icon?: ReactNode;
  isActionOpen?: boolean;
  keepPanelMounted?: boolean;
  label: ReactNode;
  onAction?: () => void;
  onSelect: () => void;
  panelContentClassName?: string;
  panelId?: string;
  panelVariant?: DisclosureListPanelVariant;
  selected: boolean;
  selectedAriaCurrent?: ComponentPropsWithoutRef<"button">["aria-current"];
  selectAriaLabel: string;
  selectedAriaLabel: string;
  selectedPreviewKind?: SelectionPreviewKind;
  selectedPreviewLabel?: ReactNode;
  selectedSelectBehavior?: "disabled" | "enabled";
  subtitle?: ReactNode;
}

/**
 * Shared row convention for scan-first lists with one primary row action and
 * one trailing detail/action affordance. The main row owns selection; the
 * selected preview owns the visible state. Use selectedPreviewKind for standard
 * state language, and selectedPreviewLabel only for a scoped override. The
 * trailing control owns secondary options or inline settings. Use the
 * ellipsis-backed SelectableOverflowRow for object lifecycle menus, and use a
 * semantic action icon here for local settings such as module setup.
 */
export function SelectableActionRow({
  actionControls,
  actionDisabled,
  actionExpanded,
  actionIcon,
  actionLabel,
  actionSelected,
  actionSize = "xl",
  actionVariant,
  children,
  icon,
  isActionOpen = false,
  keepPanelMounted = false,
  label,
  onAction,
  onSelect,
  panelContentClassName,
  panelId,
  panelVariant = "menu",
  selected,
  selectedAriaCurrent,
  selectAriaLabel,
  selectedAriaLabel,
  selectedPreviewKind = "current",
  selectedPreviewLabel,
  selectedSelectBehavior = "disabled",
  subtitle,
}: SelectableActionRowProps) {
  const generatedPanelId = useId();
  const resolvedPanelId = panelId ?? generatedPanelId;
  const hasAction =
    actionIcon !== undefined &&
    actionLabel !== undefined &&
    onAction !== undefined;
  const hasPanel = children !== undefined;
  const selectDisabled = selected && selectedSelectBehavior === "disabled";
  const controlledPanelId =
    hasPanel && (isActionOpen || keepPanelMounted)
      ? (actionControls ?? resolvedPanelId)
      : undefined;

  return (
    <div className={styles.rowCluster}>
      <div className={styles.row}>
        <OptionButton
          aria-current={selected ? selectedAriaCurrent : undefined}
          aria-label={selected ? selectedAriaLabel : selectAriaLabel}
          aria-disabled={selectDisabled ? true : undefined}
          className={styles.selectButton}
          icon={icon}
          label={label}
          presentation="list"
          preview={
            selected ? (
              <SelectionPreviewLabel kind={selectedPreviewKind}>
                {selectedPreviewLabel}
              </SelectionPreviewLabel>
            ) : undefined
          }
          selected={selected}
          selectionSemantics="visual"
          subtitle={subtitle}
          onClick={() => {
            if (!selectDisabled) {
              onSelect();
            }
          }}
        />
        {hasAction ? (
          <IconButton
            aria-controls={controlledPanelId}
            aria-expanded={
              hasPanel ? (actionExpanded ?? isActionOpen) : undefined
            }
            aria-label={actionLabel}
            className={styles.actionButton}
            disabled={actionDisabled}
            icon={actionIcon}
            selected={actionSelected ?? isActionOpen}
            selectionSemantics="visual"
            size={actionSize}
            variant={actionVariant ?? (isActionOpen ? "filled" : "outline")}
            onClick={onAction}
          />
        ) : (
          <span className={styles.actionPlaceholder} aria-hidden="true" />
        )}
      </div>

      {hasPanel ? (
        <DisclosureListPanel
          contentClassName={panelContentClassName}
          id={resolvedPanelId}
          isOpen={isActionOpen}
          keepMounted={keepPanelMounted}
          variant={panelVariant}
        >
          {children}
        </DisclosureListPanel>
      ) : null}
    </div>
  );
}

interface SelectableOverflowRowProps {
  actionsLabel: string;
  children: ReactNode;
  currentLabel?: ReactNode;
  isActionsOpen: boolean;
  label: ReactNode;
  onSelect: () => void;
  onToggleActions: () => void;
  selected: boolean;
  selectAriaLabel: string;
  selectedAriaLabel: string;
  subtitle?: ReactNode;
}

/**
 * Row convention for library/switcher surfaces.
 * The main row selects the object. The trailing ellipsis is the only action
 * that reveals lifecycle commands. Use this when one-click selection is worth
 * introducing a pattern distinct from DisclosureList rows.
 */
export function SelectableOverflowRow({
  actionsLabel,
  children,
  currentLabel,
  isActionsOpen,
  label,
  onSelect,
  onToggleActions,
  selected,
  selectAriaLabel,
  selectedAriaLabel,
  subtitle,
}: SelectableOverflowRowProps) {
  return (
    <SelectableActionRow
      actionIcon={<MoreHorizontal />}
      actionLabel={actionsLabel}
      actionSelected={isActionsOpen}
      isActionOpen={isActionsOpen}
      label={label}
      selected={selected}
      selectedAriaCurrent="true"
      selectAriaLabel={selectAriaLabel}
      selectedAriaLabel={selectedAriaLabel}
      selectedPreviewLabel={currentLabel}
      subtitle={subtitle}
      onAction={onToggleActions}
      onSelect={onSelect}
    >
      {children}
    </SelectableActionRow>
  );
}
