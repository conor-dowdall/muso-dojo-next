"use client";

import { CaseSensitive } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  getDisplayFormatLabel,
  type DisplayFormatId,
} from "@/data/displayFormats";

interface DisplayFormatTriggerButtonProps {
  className?: string;
  onClick: ButtonProps["onClick"];
  size?: ButtonProps["size"];
  tooltip?: string | false;
  value: DisplayFormatId;
}

export function DisplayFormatTriggerButton({
  className,
  onClick,
  size = "sm",
  tooltip,
  value,
}: DisplayFormatTriggerButtonProps) {
  const displayFormatLabel = getDisplayFormatLabel(value);
  const ariaLabel = `Change display text. Current: ${displayFormatLabel}`;
  const tooltipText =
    tooltip ??
    `Display text: ${value === "none" ? "none" : displayFormatLabel}`;

  if (value === "none") {
    return (
      <IconButton
        aria-label={ariaLabel}
        className={className}
        icon={<CaseSensitive />}
        size={size}
        tooltip={tooltipText}
        onClick={onClick}
      />
    );
  }

  const button = (
    <Button
      aria-label={ariaLabel}
      className={className}
      label={displayFormatLabel}
      size={size}
      onClick={onClick}
    />
  );

  if (tooltipText === false) {
    return button;
  }

  return (
    <Tooltip text={tooltipText} describeChild={false}>
      {button}
    </Tooltip>
  );
}
