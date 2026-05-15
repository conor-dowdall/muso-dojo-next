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
  value: DisplayFormatId;
  onChange: DisplayFormatSetter;
}

export function DisplayFormatButton({
  value,
  onChange,
}: DisplayFormatButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const displayFormatLabel = getDisplayFormatLabel(value);

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
          title="Choose Display Format"
          onClose={() => setIsDialogOpen(false)}
        />
        <DialogContent>
          {isDialogOpen ? (
            <DisplayFormatPicker
              value={value}
              onChange={(displayFormatId) => {
                onChange(displayFormatId);
                setIsDialogOpen(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
