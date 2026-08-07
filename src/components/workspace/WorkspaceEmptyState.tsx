import { type ReactNode } from "react";
import { Text } from "@/components/ui/typography/Text";
import styles from "./WorkspaceEmptyState.module.css";

export function WorkspaceEmptyState({
  action,
  children,
}: {
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <Text as="p" className={styles.description} size="sm" variant="muted">
        {children}
      </Text>
      {action}
    </div>
  );
}
