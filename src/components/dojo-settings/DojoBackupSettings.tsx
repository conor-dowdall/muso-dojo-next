"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { FolderOpen, RotateCcw, Save } from "lucide-react";
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
  progressions: number;
  sessions: number;
  tunings: number;
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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
  const tuningCount = formatCount(counts.tunings, "Tuning", "Tunings");
  const progressionCount = formatCount(
    counts.progressions,
    "Progression",
    "Progressions",
  );

  return (
    <DisclosureListConfirmAction
      actionAriaLabel="Start Fresh"
      actionTone="neutral"
      confirmAriaLabel="Confirm starting fresh"
      confirmButtonLabel="Start Fresh"
      confirmLabel={`Replace ${sessionCount} and ${arrangementCount} with one new empty Session. Your ${tuningCount}, ${progressionCount}, and preferences will remain.`}
      icon={<RotateCcw />}
      isConfirming={isConfirming}
      label="Start Fresh"
      secondaryAction={
        <Button
          icon={<Save />}
          label="Download Backup"
          shouldYield={false}
          size="sm"
          onClick={onDownloadBackup}
        />
      }
      subtitle="Replace all Sessions and Arrangements with a new empty Session. Your Tunings, Progressions, and preferences will remain."
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
      progressions: state.dojoSettings.customChordProgressions?.length ?? 0,
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

  const restoreConfirmation = "Replace your Dojo?";

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
