"use client";

import { MoreHorizontal } from "lucide-react";
import {
  IconButton,
  type IconButtonProps,
} from "@/components/ui/buttons/IconButton";

type OverflowMenuButtonProps = Omit<
  IconButtonProps,
  "aria-label" | "icon" | "tooltip"
> & {
  "aria-label": string;
  tooltip?: IconButtonProps["tooltip"];
};

/**
 * !!! LLM COPY CONVENTION: Ellipsis means overflow, not a specific task.
 * Pass truthful copy for the surface it opens: "Session options",
 * "Part actions", "Instrument options". Prefer Actions for lifecycle commands,
 * Options for configuration surfaces, and Sessions for the session library.
 */
export function OverflowMenuButton({
  "aria-label": ariaLabel,
  size = "sm",
  tooltip,
  ...props
}: OverflowMenuButtonProps) {
  return (
    <IconButton
      {...props}
      aria-label={ariaLabel}
      icon={<MoreHorizontal />}
      size={size}
      tooltip={tooltip === undefined ? ariaLabel : tooltip}
    />
  );
}
