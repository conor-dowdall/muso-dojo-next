"use client";

import { MoreHorizontal } from "lucide-react";
import {
  IconButton,
  type IconButtonProps,
} from "@/components/ui/buttons/IconButton";

type OverflowMenuButtonProps = Omit<IconButtonProps, "aria-label" | "icon"> & {
  "aria-label": string;
};

/**
 * Ellipsis means overflow, so the accessible label should name the menu it
 * opens rather than a specific task.
 */
export function OverflowMenuButton({
  "aria-label": ariaLabel,
  size = "sm",
  ...props
}: OverflowMenuButtonProps) {
  return (
    <IconButton
      {...props}
      aria-label={ariaLabel}
      icon={<MoreHorizontal />}
      size={size}
    />
  );
}
