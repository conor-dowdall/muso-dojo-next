import { type ReactNode } from "react";
import styles from "./PartModuleHeaderActions.module.css";

export function PartModuleHeaderActions({
  center,
  end,
}: {
  center: ReactNode;
  end: ReactNode;
}) {
  return (
    <div className={styles.actions}>
      <div className={styles.center}>{center}</div>
      <div className={styles.end}>{end}</div>
    </div>
  );
}
