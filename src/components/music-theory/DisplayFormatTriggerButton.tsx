"use client";

import { CaseSensitive } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import {
  getDisplayFormatLabel,
  type DisplayFormatId,
} from "@/data/displayFormats";

interface DisplayFormatTriggerButtonProps {
  className?: string;
  onClick: ButtonProps["onClick"];
  size?: ButtonProps["size"];
  value: DisplayFormatId;
}

export function DisplayFormatTriggerButton({
  className,
  onClick,
  size = "sm",
  value,
}: DisplayFormatTriggerButtonProps) {
  const displayFormatLabel = getDisplayFormatLabel(value);
  const ariaLabel = `Change note labels. Current: ${displayFormatLabel}`;

  if (value === "none") {
    return (
      <IconButton
        aria-label={ariaLabel}
        className={className}
        icon={<CaseSensitive />}
        size={size}
        onClick={onClick}
      />
    );
  }

  return (
    <Button
      aria-label={ariaLabel}
      className={className}
      label={displayFormatLabel}
      size={size}
      onClick={onClick}
    />
  );
}
