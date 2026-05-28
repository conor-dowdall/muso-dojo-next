"use client";

import { MoreHorizontal } from "lucide-react";
import {
  IconButton,
  type IconButtonProps,
} from "@/components/ui/buttons/IconButton";
import {
  getObjectMenuTriggerLabel,
  type ObjectMenuLevel,
} from "./objectMenuCopy";

type ObjectMenuTriggerButtonProps = Omit<
  IconButtonProps,
  "aria-label" | "icon" | "size" | "tooltip"
> & {
  "aria-label"?: string;
  level: ObjectMenuLevel;
  size?: IconButtonProps["size"];
  tooltip?: IconButtonProps["tooltip"];
};

export function ObjectMenuTriggerButton({
  "aria-label": ariaLabel,
  level,
  size = "sm",
  tooltip,
  ...props
}: ObjectMenuTriggerButtonProps) {
  const label = ariaLabel ?? getObjectMenuTriggerLabel(level);

  return (
    <IconButton
      {...props}
      aria-label={label}
      icon={<MoreHorizontal />}
      size={size}
      tooltip={tooltip === undefined ? label : tooltip}
    />
  );
}
