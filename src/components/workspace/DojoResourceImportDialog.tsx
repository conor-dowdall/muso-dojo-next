"use client";

import { useMemo, useState } from "react";
import { FileInput } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  Dialog,
  DialogContent,
  DialogContentSection,
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import {
  type DojoResourceImportCandidate,
  type DojoResourceImportCatalog,
} from "@/utils/dojo-backup/dojoResourceImport";
import styles from "./DojoResourceImportDialog.module.css";

function formatBackupExportDate(exportedAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(exportedAt));
}

function formatImportLabel(count: number) {
  return `Import ${count} ${count === 1 ? "Resource" : "Resources"}`;
}

function ResourceImportRow({
  candidate,
  selected,
  onChange,
}: {
  candidate: DojoResourceImportCandidate;
  selected: boolean;
  onChange: (selected: boolean) => void;
}) {
  const resourceKind = candidate.kind === "tuning" ? "tuning" : "progression";

  return (
    <DisclosureListChoice
      aria-label={`Include ${candidate.name} ${resourceKind}`}
      label={candidate.name}
      preview={!selected && candidate.collision ? "Skip" : undefined}
      selected={selected}
      selectedPreviewKind="included"
      shouldYield={false}
      subtitle={
        <span className={styles.resourceDetails}>
          <span>{candidate.subtitle}</span>
          {candidate.collision ? (
            <span>
              Keep Both imports this resource as “{candidate.keepBothName}”.
            </span>
          ) : null}
        </span>
      }
      onClick={() => onChange(!selected)}
    />
  );
}

function ResourceImportSection({
  candidates,
  heading,
  selectedKeys,
  onSelectionChange,
}: {
  candidates: DojoResourceImportCandidate[];
  heading: string;
  selectedKeys: ReadonlySet<string>;
  onSelectionChange: (key: string, selected: boolean) => void;
}) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <DialogContentSection ariaLabel={heading} className={styles.section}>
      <span className={styles.sectionHeading}>
        <Heading as="h3" size="xs" variant="muted">
          {heading}
        </Heading>
        <Text as="span" size="xs" variant="muted">
          {candidates.length}
        </Text>
      </span>
      <DisclosureList grouped>
        <DisclosureListGroup>
          {candidates.map((candidate) => (
            <ResourceImportRow
              key={candidate.key}
              candidate={candidate}
              selected={selectedKeys.has(candidate.key)}
              onChange={(selected) =>
                onSelectionChange(candidate.key, selected)
              }
            />
          ))}
        </DisclosureListGroup>
      </DisclosureList>
    </DialogContentSection>
  );
}

export function DojoResourceImportDialog({
  catalog,
  exportedAt,
  isOpen,
  onClose,
  onImport,
}: {
  catalog: DojoResourceImportCatalog;
  exportedAt: string;
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedKeys: readonly string[]) => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const totalResources = catalog.tunings.length + catalog.progressions.length;
  const selectedCount = selectedKeys.size;

  const importLabel = useMemo(
    () => formatImportLabel(selectedCount),
    [selectedCount],
  );

  const changeSelection = (key: string, selected: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);

      if (selected) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return next;
    });
  };
  const closeDialog = () => {
    setSelectedKeys(new Set());
    onClose();
  };
  const importResources = () => {
    const keys = [...selectedKeys];
    setSelectedKeys(new Set());
    onImport(keys);
  };

  return (
    <Dialog isOpen={isOpen} onClose={closeDialog}>
      <DialogHeader
        icon={<FileInput />}
        title="Import Resources"
        onClose={closeDialog}
      />
      <DialogContent layout="stack">
        <Text as="p" size="sm" variant="muted">
          Backup exported {formatBackupExportDate(exportedAt)}. Select the
          resources to add to your Dojo.
        </Text>
        {totalResources === 0 ? (
          <Text as="p" size="sm" variant="muted">
            This backup contains no Custom Tunings or Custom Chord Progressions.
          </Text>
        ) : (
          <>
            <ResourceImportSection
              candidates={catalog.tunings}
              heading="Custom Tunings"
              selectedKeys={selectedKeys}
              onSelectionChange={changeSelection}
            />
            <ResourceImportSection
              candidates={catalog.progressions}
              heading="Custom Chord Progressions"
              selectedKeys={selectedKeys}
              onSelectionChange={changeSelection}
            />
          </>
        )}
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Import actions">
          <DialogFooterActionGroup placement="secondary">
            <Button label="Cancel" size="lg" onClick={closeDialog} />
          </DialogFooterActionGroup>
          <DialogFooterActionGroup>
            <Button
              disabled={selectedCount === 0}
              label={importLabel}
              preventConcurrentClicks
              size="lg"
              onClick={importResources}
            />
          </DialogFooterActionGroup>
        </DialogFooterActionBar>
      </DialogFooter>
    </Dialog>
  );
}
