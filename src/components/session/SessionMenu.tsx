"use client";

import { Settings2 } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import styles from "./SessionMenu.module.css";

interface SessionMenuProps {
  onOpenDojoSettings: () => void;
}

export function SessionMenu({ onOpenDojoSettings }: SessionMenuProps) {
  return (
    <span
      className={styles.dojoSettingsGroup}
      role="group"
      aria-label="Dojo settings"
    >
      <IconButton
        aria-label="Dojo settings"
        icon={<Settings2 />}
        size="sm"
        onClick={onOpenDojoSettings}
      />
    </span>
  );
}
