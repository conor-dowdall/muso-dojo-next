import { type ReactNode } from "react";
import styles from "./TactileControlGroup.module.css";

interface TactileControlGroupProps {
  "aria-label": string;
  children: ReactNode;
  className?: string;
  controlsClassName?: string;
  readout?: ReactNode;
  readoutLive?: "off" | "polite";
  unavailable?: boolean;
}

export function TactileControlGroup({
  "aria-label": ariaLabel,
  children,
  className,
  controlsClassName,
  readout,
  readoutLive,
  unavailable = false,
}: TactileControlGroupProps) {
  return (
    <div
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-has-readout={readout !== undefined || undefined}
    >
      <div
        className={[styles.controls, controlsClassName]
          .filter(Boolean)
          .join(" ")}
        role="group"
        aria-label={ariaLabel}
      >
        {children}
      </div>
      {readout !== undefined ? (
        <output className={styles.readout} aria-live={readoutLive}>
          {unavailable ? null : readout}
        </output>
      ) : null}
    </div>
  );
}
