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

function createDefaultSelectedKeys(catalog: DojoResourceImportCatalog) {
  return new Set(
    [...catalog.tunings, ...catalog.progressions]
      .filter(({ collision }) => !collision)
      .map(({ key }) => key),
  );
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
  const collisionImportLabel = candidate.keepBothName
    ? `Include backup ${candidate.name} ${resourceKind} as ${candidate.keepBothName}`
    : undefined;

  return (
    <DisclosureListChoice
      aria-label={
        selected
          ? `Skip ${candidate.name} ${resourceKind}`
          : (collisionImportLabel ??
            `Include ${candidate.name} ${resourceKind}`)
      }
      label={candidate.name}
      preview={!selected ? "Skip" : undefined}
      selected={selected}
      selectedPreviewKind="included"
      selectedPreviewLabel={candidate.collision ? "KEEP BOTH" : undefined}
      shouldYield={false}
      subtitle={
        <span className={styles.resourceDetails}>
          <span>{candidate.subtitle}</span>
          {candidate.collision && candidate.keepBothName ? (
            <span>
              A resource with this name is already in your Dojo. If included,
              the backup version will be imported as “{candidate.keepBothName}”.
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
  const defaultSelectedKeys = useMemo(
    () => createDefaultSelectedKeys(catalog),
    [catalog],
  );
  const [selectionState, setSelectionState] = useState<{
    catalog: DojoResourceImportCatalog;
    selectedKeys: ReadonlySet<string>;
  }>(() => ({ catalog, selectedKeys: defaultSelectedKeys }));
  const selectedKeys =
    selectionState.catalog === catalog
      ? selectionState.selectedKeys
      : defaultSelectedKeys;
  const totalResources = catalog.tunings.length + catalog.progressions.length;
  const selectedCount = selectedKeys.size;

  const importLabel = useMemo(
    () => formatImportLabel(selectedCount),
    [selectedCount],
  );

  const changeSelection = (key: string, selected: boolean) => {
    setSelectionState((current) => {
      const currentKeys =
        current.catalog === catalog
          ? current.selectedKeys
          : defaultSelectedKeys;
      const next = new Set(currentKeys);

      if (selected) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return { catalog, selectedKeys: next };
    });
  };
  const closeDialog = () => {
    setSelectionState({ catalog, selectedKeys: defaultSelectedKeys });
    onClose();
  };
  const importResources = () => {
    const keys = [...selectedKeys];
    setSelectionState({ catalog, selectedKeys: defaultSelectedKeys });
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
          Backup exported {formatBackupExportDate(exportedAt)}. Resources
          without name conflicts are included automatically. Review any
          conflicts before importing.
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
