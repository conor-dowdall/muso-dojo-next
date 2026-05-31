"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog/Dialog";
import { DisplayFormatPicker } from "./DisplayFormatPicker";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";
import { DisplayFormatTriggerButton } from "./DisplayFormatTriggerButton";

interface DisplayFormatButtonProps {
  value: DisplayFormatId;
  onChange: DisplayFormatSetter;
}

export function DisplayFormatButton({
  value,
  onChange,
}: DisplayFormatButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <DisplayFormatTriggerButton
        value={value}
        onClick={() => setIsDialogOpen(true)}
      />

      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogHeader
          title="Choose Note Labels"
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
