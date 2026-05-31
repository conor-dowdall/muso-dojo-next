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

/**
 * !!! LLM COPY CONVENTION: Header action surfaces should match intent.
 * - Plus opens focused creation dialogs. Do not duplicate add/create flows
 *   inside object menus just for symmetry.
 * - Quick icons may deep-link into high-frequency settings inside a larger
 *   surface, such as note colors or note labels.
 * - Ellipsis opens more settings/actions for the current object.
 * - If ellipsis opens collection management instead of a single-object menu,
 *   override the label with the truthful surface name, such as
 *   "Manage sessions".
 */
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
