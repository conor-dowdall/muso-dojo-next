"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { FolderOpen, Save } from "lucide-react";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListConfirmAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { stopAllAudioPlayback } from "@/audio";
import { useAppStore } from "@/stores/appStore";
import {
  DojoBackupError,
  downloadDojoBackupFile,
  readDojoBackupFile,
  type ParsedDojoBackup,
} from "@/utils/dojo-backup/dojoBackup";
import styles from "./DojoSettingsDialog.module.css";

interface DojoBackupSettingsProps {
  onRestoreComplete: () => void;
}

function getBackupErrorMessage(error: unknown) {
  return error instanceof DojoBackupError
    ? error.message
    : "The backup operation could not be completed.";
}

export function DojoBackupSettings({
  onRestoreComplete,
}: DojoBackupSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingBackup, setIsReadingBackup] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<ParsedDojoBackup | null>(
    null,
  );
  const restoreDojoSnapshot = useAppStore((state) => state.restoreDojoSnapshot);

  const exportBackup = () => {
    setErrorMessage(null);

    try {
      downloadDojoBackupFile(useAppStore.getState());
    } catch (error) {
      setErrorMessage(getBackupErrorMessage(error));
    }
  };

  const chooseBackupFile = () => {
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const readSelectedBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file) {
      return;
    }

    setErrorMessage(null);
    setIsReadingBackup(true);

    try {
      setPendingBackup(await readDojoBackupFile(file));
    } catch (error) {
      setPendingBackup(null);
      setErrorMessage(getBackupErrorMessage(error));
    } finally {
      setIsReadingBackup(false);
    }
  };

  const cancelRestore = () => {
    setPendingBackup(null);
    setErrorMessage(null);
  };

  const restoreBackup = () => {
    if (!pendingBackup) {
      return;
    }

    stopAllAudioPlayback();
    restoreDojoSnapshot(pendingBackup.snapshot);
    setPendingBackup(null);
    onRestoreComplete();
  };

  const restoreConfirmation = "Replace your Dojo?";

  return (
    <>
      <Heading as="h3" size="xs" variant="muted">
        Data &amp; Backups
      </Heading>
      <Text as="p" size="sm" variant="muted">
        Everything in your Dojo is saved automatically on this device.
      </Text>
      <DisclosureList>
        <DisclosureListGroup>
          <DisclosureListAction
            icon={<Save />}
            label="Download Dojo Backup"
            shouldYield={false}
            subtitle="Save a portable copy of your Sessions, Arrangements, personal library, and preferences."
            onClick={exportBackup}
          />

          {pendingBackup ? (
            <DisclosureListConfirmAction
              actionAriaLabel="Restore Dojo Backup"
              confirmAriaLabel={restoreConfirmation}
              confirmButtonLabel="Replace"
              confirmLabel={restoreConfirmation}
              icon={<FolderOpen />}
              isConfirming
              label="Restore Dojo Backup"
              tone="danger"
              onCancel={cancelRestore}
              onConfirm={restoreBackup}
              onRequestConfirm={chooseBackupFile}
            />
          ) : (
            <DisclosureListAction
              aria-label="Choose a Dojo backup JSON file to restore"
              disabled={isReadingBackup}
              icon={<FolderOpen />}
              label={
                isReadingBackup ? "Reading Backup…" : "Restore Dojo Backup"
              }
              shouldYield={false}
              subtitle="Replace everything in your Dojo with a backup file."
              onClick={chooseBackupFile}
            />
          )}

          {errorMessage ? (
            <Text as="p" className={styles.backupError} role="alert" size="sm">
              {errorMessage}
            </Text>
          ) : null}
        </DisclosureListGroup>
      </DisclosureList>
      <input
        ref={fileInputRef}
        hidden
        accept=".json,application/json"
        type="file"
        onChange={readSelectedBackup}
      />
    </>
  );
}
