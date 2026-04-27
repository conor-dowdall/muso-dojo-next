"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { DisplayFormatPicker } from "./DisplayFormatPicker";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  getDisplayFormatLabel,
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";

interface DisplayFormatButtonProps {
  activeDisplayFormatId: DisplayFormatId;
  setActiveDisplayFormatId: DisplayFormatSetter;
}

export function DisplayFormatButton({
  activeDisplayFormatId,
  setActiveDisplayFormatId,
}: DisplayFormatButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const displayFormatLabel = getDisplayFormatLabel(activeDisplayFormatId);

  return (
    <>
      <Tooltip text="Change display format" describeChild={false}>
        <Button
          aria-label={`Change display format. Current: ${displayFormatLabel}`}
          label={displayFormatLabel}
          size="sm"
          onClick={() => setIsDialogOpen(true)}
        />
      </Tooltip>

      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogHeader
          title="Display Format"
          onClose={() => setIsDialogOpen(false)}
        />
        <DialogContent>
          {isDialogOpen ? (
            <DisplayFormatPicker
              activeDisplayFormatId={activeDisplayFormatId}
              onDisplayFormatChange={setActiveDisplayFormatId}
              onSelect={() => setIsDialogOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
