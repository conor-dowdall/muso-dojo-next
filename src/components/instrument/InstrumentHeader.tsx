import { type ReactNode } from "react";
import styles from "./InstrumentHeader.module.css";

interface InstrumentHeaderProps {
  displayControls?: ReactNode;
  children?: ReactNode;
}

export function InstrumentHeader({
  displayControls,
  children,
}: InstrumentHeaderProps) {
  if (!displayControls && !children) return null;

  return (
    <header className={styles.instrumentHeader}>
      {displayControls ? (
        <div className={styles.displayControlsWrapper}>{displayControls}</div>
      ) : null}
      <div className={styles.actionsWrapper}>{children}</div>
    </header>
  );
}
