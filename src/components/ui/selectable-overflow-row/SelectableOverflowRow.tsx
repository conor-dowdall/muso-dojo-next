"use client";

import { type ReactNode, useId } from "react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { DisclosureListPanel } from "@/components/ui/disclosure-list/DisclosureList";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import styles from "./SelectableOverflowRow.module.css";

interface SelectableOverflowRowProps {
  actionsLabel: string;
  children: ReactNode;
  currentLabel?: string;
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
  currentLabel = "CURRENT",
  isActionsOpen,
  label,
  onSelect,
  onToggleActions,
  selected,
  selectAriaLabel,
  selectedAriaLabel,
  subtitle,
}: SelectableOverflowRowProps) {
  const panelId = useId();

  return (
    <div className={styles.rowCluster}>
      <div className={styles.row}>
        <OptionButton
          aria-current={selected ? "true" : undefined}
          aria-label={selected ? selectedAriaLabel : selectAriaLabel}
          aria-disabled={selected ? true : undefined}
          className={styles.selectButton}
          label={label}
          presentation="list"
          preview={
            selected ? (
              <span className={styles.currentMarker}>{currentLabel}</span>
            ) : undefined
          }
          selected={selected}
          selectionSemantics="visual"
          subtitle={subtitle}
          onClick={() => {
            if (!selected) {
              onSelect();
            }
          }}
        />
        <OverflowMenuButton
          aria-controls={isActionsOpen ? panelId : undefined}
          aria-expanded={isActionsOpen}
          aria-label={actionsLabel}
          className={styles.overflowButton}
          size="xl"
          selected={isActionsOpen}
          tooltip={actionsLabel}
          variant={isActionsOpen ? "filled" : "outline"}
          onClick={onToggleActions}
        />
      </div>

      <DisclosureListPanel id={panelId} isOpen={isActionsOpen} variant="menu">
        {children}
      </DisclosureListPanel>
    </div>
  );
}
