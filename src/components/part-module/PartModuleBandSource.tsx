"use client";

import { Disc3 } from "lucide-react";
import styles from "./PartModuleBandSource.module.css";

export function PartModuleBandSourceIndicator() {
  return (
    <span
      aria-label="Used by Backing Band"
      className={styles.indicator}
      role="img"
      title="Used by Backing Band"
    >
      <Disc3 aria-hidden="true" />
    </span>
  );
}
