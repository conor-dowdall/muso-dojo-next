import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import styles from "./ControlHeader.module.css";

interface ControlHeaderProps extends Omit<
  ComponentPropsWithoutRef<"header">,
  "children"
> {
  actions?: ReactNode;
  actionsClassName?: string;
  actionsGrow?: boolean;
  primary?: ReactNode;
  primaryClassName?: string;
}

interface ControlHeaderLayoutProps {
  className?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

interface ControlHeaderClusterProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> {
  children: ReactNode;
  gap?: "cluster" | "peer";
}

function joinClasses(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ControlHeaderLayout({
  className,
  leading,
  trailing,
}: ControlHeaderLayoutProps) {
  return (
    <div className={joinClasses(styles.layout, className)}>
      {leading !== undefined && leading !== null ? (
        <div className={styles.leading}>{leading}</div>
      ) : null}
      {trailing !== undefined && trailing !== null ? (
        <div className={styles.trailing}>{trailing}</div>
      ) : null}
    </div>
  );
}

export function ControlHeaderCluster({
  children,
  className,
  gap = "peer",
  ...props
}: ControlHeaderClusterProps) {
  return (
    <span
      {...props}
      className={joinClasses(styles.cluster, className)}
      data-gap={gap}
    >
      {children}
    </span>
  );
}

export function ControlHeader({
  actions,
  actionsClassName,
  actionsGrow = false,
  className,
  primary,
  primaryClassName,
  ...props
}: ControlHeaderProps) {
  return (
    <header {...props} className={joinClasses(styles.controlHeader, className)}>
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
