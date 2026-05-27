import { type ReactNode } from "react";
import styles from "./ControlHeader.module.css";

interface ControlHeaderProps {
  actions?: ReactNode;
  actionsClassName?: string;
  actionsGrow?: boolean;
  className?: string;
  primary?: ReactNode;
  primaryClassName?: string;
}

function joinClasses(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ControlHeader({
  actions,
  actionsClassName,
  actionsGrow = false,
  className,
  primary,
  primaryClassName,
}: ControlHeaderProps) {
  return (
    <header className={joinClasses(styles.controlHeader, className)}>
      {primary !== undefined && primary !== null ? (
        <div className={joinClasses(styles.primary, primaryClassName)}>
          {primary}
        </div>
      ) : null}
      {actions !== undefined && actions !== null ? (
        <div
          className={joinClasses(styles.actions, actionsClassName)}
          data-grow={actionsGrow}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
