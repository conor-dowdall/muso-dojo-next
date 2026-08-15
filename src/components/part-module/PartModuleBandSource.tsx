"use client";

import { Disc3 } from "lucide-react";
import styles from "./PartModuleBandSource.module.css";

export function PartModuleBandSourceIndicator({ label }: { label: string }) {
  return (
    <span aria-label={label} className={styles.indicator} role="img">
      <Disc3 aria-hidden="true" />
    </span>
  );
}
