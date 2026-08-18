"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { Broom, Download, FileUp } from "lucide-react";
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
  chordProgressions: number;
  sessions: number;
  tunings: number;
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
  onDownloadBackup,
}: {
  backup: ParsedDojoBackup;
  onCancel: () => void;
  onConfirm: () => void;
  onChooseBackup: () => void;
  onDownloadBackup: () => void;
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
  const confirmation = "Restore this backup?";

  return (
    <DisclosureListConfirmAction
      actionAriaLabel="Restore from backup"
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
            All current Dojo data and settings will be replaced. This cannot be
            undone.
          </span>
        </span>
      }
      confirmLabel={confirmation}
      icon={<FileUp />}
      isConfirming
      label="Restore from Backup"
      secondaryAction={
        <Button
          icon={<Download />}
          label="Download Current Backup"
          shouldYield={false}
          size="sm"
          onClick={onDownloadBackup}
        />
      }
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
      onRequestConfirm={onChooseBackup}
    />
  );
}

export function DojoClearAction({
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
  const tuningCount = formatCount(
    counts.tunings,
    "Custom Tuning",
    "Custom Tunings",
  );
  const progressionCount = formatCount(
    counts.chordProgressions,
    "Custom Chord Progression",
    "Custom Chord Progressions",
  );
  const confirmation = "Reset Dojo?";

  return (
    <DisclosureListConfirmAction
      actionAriaLabel="Reset Dojo"
      actionTone="neutral"
      confirmAriaLabel={confirmation}
      confirmButtonLabel="Reset Dojo"
      confirmDetails={
        <span className={styles.confirmationSummary}>
          <span>
            {sessionCount} • {arrangementCount}
          </span>
          <span>
            {tuningCount} • {progressionCount}
          </span>
          <span className={styles.confirmationImpactStatement}>
            Your settings will be reset.
          </span>
          <span>One new empty Session will be created.</span>
        </span>
      }
      confirmLabel={confirmation}
      icon={<Broom />}
      isConfirming={isConfirming}
      label="Reset Dojo"
      secondaryAction={
        <Button
          icon={<Download />}
          label="Download Current Backup"
          shouldYield={false}
          size="sm"
          onClick={onDownloadBackup}
        />
      }
      subtitle="Delete all Sessions, Arrangements, and custom resources, and reset your settings."
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
  const [isClearDojoConfirming, setIsClearDojoConfirming] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<ParsedDojoBackup | null>(
    null,
  );
  const restoreDojoSnapshot = useAppStore((state) => state.restoreDojoSnapshot);
  const clearDojo = useAppStore((state) => state.clearDojo);
  const counts = useAppStore(
    useShallow((state): DojoContentCounts => ({
      arrangements: Object.keys(state.arrangements).length,
      chordProgressions:
        state.dojoSettings.customChordProgressions?.length ?? 0,
      sessions: Object.keys(state.sessions).length,
      tunings: state.dojoSettings.customFretboardTunings?.length ?? 0,
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
    setIsClearDojoConfirming(false);
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

  const requestClearDojo = () => {
    setErrorMessage(null);
    setPendingBackup(null);
    setIsClearDojoConfirming(true);
  };

  const clearAllDojoData = () => {
    stopAllAudioPlayback();
    clearDojo();
    setIsClearDojoConfirming(false);
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
            icon={<Download />}
            label="Download Backup"
            shouldYield={false}
            subtitle="Save a file containing all Sessions, Arrangements, custom resources, and settings."
            onClick={exportBackup}
          />

          {pendingBackup ? (
            <DojoRestoreAction
              backup={pendingBackup}
              onCancel={cancelRestore}
              onChooseBackup={chooseBackupFile}
              onConfirm={restoreBackup}
              onDownloadBackup={exportBackup}
            />
          ) : (
            <DisclosureListAction
              aria-label="Choose a Dojo backup JSON file to restore"
              disabled={isReadingBackup}
              icon={<FileUp />}
              label={
                isReadingBackup ? "Reading Backup…" : "Restore from Backup"
              }
              shouldYield={false}
              subtitle="Replace everything in this Dojo with data from a backup file."
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
          <DojoClearAction
            counts={counts}
            isConfirming={isClearDojoConfirming}
            onCancel={() => setIsClearDojoConfirming(false)}
            onConfirm={clearAllDojoData}
            onDownloadBackup={exportBackup}
            onRequestConfirm={requestClearDojo}
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
