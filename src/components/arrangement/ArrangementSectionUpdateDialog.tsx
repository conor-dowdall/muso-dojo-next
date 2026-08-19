"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Text } from "@/components/ui/typography/Text";

export function ArrangementSectionUpdateDialog({
  isOpen,
  onClose,
  onConfirm,
  sectionCount,
  sessionCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sectionCount: number;
  sessionCount: number;
}) {
  const sectionLabel = sectionCount === 1 ? "Section" : "Sections";
  const sessionLabel = sessionCount === 1 ? "Session" : "Sessions";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="standard">
      <DialogHeader
        icon={<RefreshCw />}
        title="Update Changed Sections"
        onClose={onClose}
      />
      <DialogContent layout="stack">
        <Text as="p">
          Update {sectionCount} {sectionLabel} with the latest content from{" "}
          {sessionCount} {sessionLabel}?
        </Text>
        <Text as="p" size="sm" variant="muted">
          Saved Parts and playback settings will be replaced. Arrangement order,
          play counts, and tempo settings won&apos;t change.
        </Text>
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Section update actions">
          <DialogFooterActionGroup placement="secondary">
            <Button label="Cancel" size="lg" onClick={onClose} />
          </DialogFooterActionGroup>
          <DialogFooterActionGroup>
            <Button
              label={`Update ${sectionCount} ${sectionLabel}`}
              preventConcurrentClicks
              size="lg"
              onClick={onConfirm}
            />
          </DialogFooterActionGroup>
        </DialogFooterActionBar>
      </DialogFooter>
    </Dialog>
  );
}
