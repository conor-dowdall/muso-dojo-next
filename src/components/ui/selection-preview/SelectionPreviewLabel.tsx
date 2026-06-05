import { type ReactNode } from "react";
import styles from "./SelectionPreviewLabel.module.css";

export type SelectionPreviewKind = "current" | "included" | "selected";

export const selectionPreviewLabels = {
  current: "CURRENT",
  included: "INCLUDED",
  selected: "SELECTED",
} as const satisfies Record<SelectionPreviewKind, string>;

interface SelectionPreviewLabelProps {
  children?: ReactNode;
  kind?: SelectionPreviewKind;
}

export function SelectionPreviewLabel({
  children,
  kind = "selected",
}: SelectionPreviewLabelProps) {
  return (
    <span className={styles.label}>
      {children ?? selectionPreviewLabels[kind]}
    </span>
  );
}
