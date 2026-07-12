"use client";

import { type ReactNode } from "react";
import { Disc3 } from "lucide-react";
import styles from "./PartModuleBandSource.module.css";

export function BackingBandLabel({ children }: { children: ReactNode }) {
  return (
    <span className={styles.label}>
      <Disc3 aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

export function PartModuleBandSourceIndicator() {
  return (
    <span
      aria-label="Backing Band source"
      className={styles.indicator}
      role="img"
      title="Backing Band source"
    >
      <Disc3 aria-hidden="true" />
    </span>
  );
}
