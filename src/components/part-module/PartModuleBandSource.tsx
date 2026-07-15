"use client";

import { Disc3 } from "lucide-react";
import styles from "./PartModuleBandSource.module.css";

export function PartModuleBandSourceIndicator() {
  return (
    <span
      aria-label="Backing Band source"
      className={styles.indicator}
      role="img"
    >
      <Disc3 aria-hidden="true" />
    </span>
  );
}
