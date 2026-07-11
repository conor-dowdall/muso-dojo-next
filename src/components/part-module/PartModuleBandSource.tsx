"use client";

import { BoomBox } from "lucide-react";
import styles from "./PartModuleBandSource.module.css";

export function PartModuleBandSourceIndicator() {
  return (
    <span
      aria-label="Practice Band source"
      className={styles.indicator}
      role="img"
      title="Practice Band source"
    >
      <BoomBox aria-hidden="true" />
    </span>
  );
}
