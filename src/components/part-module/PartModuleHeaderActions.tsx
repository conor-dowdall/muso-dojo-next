import { type ReactNode } from "react";
import styles from "./PartModuleHeaderActions.module.css";

export function PartModuleHeaderActions({
  center,
  end,
  start,
}: {
  center?: ReactNode;
  end?: ReactNode;
  start?: ReactNode;
}) {
  return (
    <div className={styles.actions}>
      {start ? <div className={styles.start}>{start}</div> : null}
      {center ? <div className={styles.center}>{center}</div> : null}
      {end ? <div className={styles.end}>{end}</div> : null}
    </div>
  );
}
