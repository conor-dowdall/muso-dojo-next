"use client";

import { useEffect, useState } from "react";
import { SaveOff } from "lucide-react";
import { APP_STORE_PERSISTENCE_STATUS_EVENT } from "@/stores/app-store/persistence";
import styles from "./PersistenceStatusViewport.module.css";

export function PersistenceStatusViewport() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const handleStatus = (event: Event) => {
      setFailed((event as CustomEvent<"failed" | "saved">).detail === "failed");
    };
    window.addEventListener(APP_STORE_PERSISTENCE_STATUS_EVENT, handleStatus);
    return () =>
      window.removeEventListener(
        APP_STORE_PERSISTENCE_STATUS_EVENT,
        handleStatus,
      );
  }, []);
  return failed ? (
    <div className={styles.viewport}>
      <div className={styles.pill} role="alert">
        <SaveOff aria-hidden="true" />
        <span>Changes could not be saved on this device</span>
      </div>
    </div>
  ) : null;
}
