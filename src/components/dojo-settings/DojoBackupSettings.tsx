"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { Broom, FolderOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
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
  onDojoReplaceComplete: () => void;
}

interface DojoContentCounts {
  arrangements: number;
  sessions: number;
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatBackupExportDate(exportedAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(exportedAt));
}

export function DojoRestoreAction({
  backup,
  onCancel,
  onConfirm,
  onChooseBackup,
}: {
  backup: ParsedDojoBackup;
  onCancel: () => void;
  onConfirm: () => void;
  onChooseBackup: () => void;
}) {
  const snapshot = backup.snapshot;
  const sessionCount = formatCount(
    Object.keys(snapshot.sessions).length,
    "Session",
    "Sessions",
  );
  const arrangementCount = formatCount(
    Object.keys(snapshot.arrangements).length,
    "Arrangement",
    "Arrangements",
  );
  const tuningCount = formatCount(
    snapshot.dojoSettings.customFretboardTunings?.length ?? 0,
    "Custom Tuning",
    "Custom Tunings",
  );
  const progressionCount = formatCount(
    snapshot.dojoSettings.customChordProgressions?.length ?? 0,
    "Custom Chord Progression",
    "Custom Chord Progressions",
  );
  const confirmation = "Restore this Dojo backup?";

  return (
    <DisclosureListConfirmAction
      actionAriaLabel="Restore Dojo"
      confirmAriaLabel={confirmation}
      confirmButtonLabel="Restore Backup"
      confirmDetails={
        <span className={styles.confirmationSummary}>
          <span>Exported: {formatBackupExportDate(backup.exportedAt)}</span>
          <span>
            {sessionCount} • {arrangementCount}
          </span>
          <span>
            {tuningCount} • {progressionCount}
          </span>
          <span className={styles.confirmationImpactStatement}>
            Your preferences will also be replaced.
          </span>
        </span>
      }
      confirmLabel={confirmation}
      icon={<FolderOpen />}
      isConfirming
      label="Restore Dojo"
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
      onRequestConfirm={onChooseBackup}
    />
  );
}

export function DojoStartFreshAction({
  counts,
  isConfirming,
  onCancel,
  onConfirm,
  onDownloadBackup,
  onRequestConfirm,
}: {
  counts: DojoContentCounts;
  isConfirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onDownloadBackup: () => void;
  onRequestConfirm: () => void;
}) {
  const sessionCount = formatCount(counts.sessions, "Session", "Sessions");
  const arrangementCount = formatCount(
    counts.arrangements,
    "Arrangement",
    "Arrangements",
  );
  const confirmation = "Clear Sessions & Arrangements?";

  return (
    <DisclosureListConfirmAction
      actionAriaLabel="Clear Sessions & Arrangements"
      actionTone="neutral"
      confirmAriaLabel={confirmation}
      confirmButtonLabel="Clear Sessions & Arrangements"
      confirmDetails={
        <span className={styles.confirmationSummary}>
          <span>
            {sessionCount} • {arrangementCount}
          </span>
          <span>Replaced by one new empty Session.</span>
          <span className={styles.confirmationImpactStatement}>
            Your Custom Tunings, Custom Chord Progressions, and preferences will
            remain.
          </span>
        </span>
      }
      confirmLabel={confirmation}
      icon={<Broom />}
      isConfirming={isConfirming}
      label="Clear Sessions & Arrangements"
      secondaryAction={
        <Button
          icon={<Save />}
          label="Download Backup"
          shouldYield={false}
          size="sm"
          onClick={onDownloadBackup}
        />
      }
      subtitle="Remove all Sessions and Arrangements. Your personal library and preferences will remain."
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
      onRequestConfirm={onRequestConfirm}
    />
  );
}

function getBackupErrorMessage(error: unknown) {
  return error instanceof DojoBackupError
    ? error.message
    : "The backup operation could not be completed.";
}

export function DojoBackupSettings({
  onDojoReplaceComplete,
}: DojoBackupSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingBackup, setIsReadingBackup] = useState(false);
  const [isStartFreshConfirming, setIsStartFreshConfirming] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<ParsedDojoBackup | null>(
    null,
  );
  const restoreDojoSnapshot = useAppStore((state) => state.restoreDojoSnapshot);
  const startFreshDojo = useAppStore((state) => state.startFreshDojo);
  const counts = useAppStore(
    useShallow((state): DojoContentCounts => ({
      arrangements: Object.keys(state.arrangements).length,
      sessions: Object.keys(state.sessions).length,
    })),
  );

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
    setIsStartFreshConfirming(false);
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
    onDojoReplaceComplete();
  };

  const requestStartFresh = () => {
    setErrorMessage(null);
    setPendingBackup(null);
    setIsStartFreshConfirming(true);
  };

  const startFresh = () => {
    stopAllAudioPlayback();
    startFreshDojo();
    setIsStartFreshConfirming(false);
    onDojoReplaceComplete();
  };

  return (
    <>
      <Heading as="h3" size="xs" variant="muted">
        Data &amp; Backups
      </Heading>
      <Text as="p" size="sm" variant="muted">
        Everything in your Dojo is saved automatically on this device.
      </Text>
      <DisclosureList grouped groupGap="section">
        <DisclosureListGroup>
          <DisclosureListAction
            icon={<Save />}
            label="Back Up Dojo"
            shouldYield={false}
            subtitle="Save all Dojo data as a backup file."
            onClick={exportBackup}
          />

          {pendingBackup ? (
            <DojoRestoreAction
              backup={pendingBackup}
              onCancel={cancelRestore}
              onChooseBackup={chooseBackupFile}
              onConfirm={restoreBackup}
            />
          ) : (
            <DisclosureListAction
              aria-label="Choose a Dojo backup JSON file to restore"
              disabled={isReadingBackup}
              icon={<FolderOpen />}
              label={isReadingBackup ? "Reading Backup…" : "Restore Dojo"}
              shouldYield={false}
              subtitle="Restore all Dojo data from a backup file."
              onClick={chooseBackupFile}
            />
          )}

          {errorMessage ? (
            <Text as="p" className={styles.backupError} role="alert" size="sm">
              {errorMessage}
            </Text>
          ) : null}
        </DisclosureListGroup>
        <DisclosureListGroup>
          <DojoStartFreshAction
            counts={counts}
            isConfirming={isStartFreshConfirming}
            onCancel={() => setIsStartFreshConfirming(false)}
            onConfirm={startFresh}
            onDownloadBackup={exportBackup}
            onRequestConfirm={requestStartFresh}
          />
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
