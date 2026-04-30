import { type ReactNode } from "react";
import { Tooltip, type TooltipSide } from "@/components/ui/tooltip/Tooltip";
import { Button, type ButtonProps } from "./Button";
import styles from "./IconButton.module.css";

export type IconButtonProps = Omit<
  ButtonProps,
  | "accessory"
  | "aria-label"
  | "icon"
  | "iconAriaHidden"
  | "iconPosition"
  | "iconSizing"
  | "label"
  | "labelProps"
  | "layout"
  | "subtitle"
> & {
  "aria-label": string;
  icon: ReactNode;
  tooltip?: string | false;
  tooltipSide?: TooltipSide;
};

export function IconButton({
  "aria-label": ariaLabel,
  className = "",
  icon,
  tooltip,
  tooltipSide,
  ...props
}: IconButtonProps) {
  const buttonClasses = [styles.iconButton, className]
    .filter(Boolean)
    .join(" ");

  const button = (
    <Button
      {...props}
      aria-label={ariaLabel}
      className={buttonClasses}
      icon={icon}
      iconAriaHidden
    />
  );

  if (tooltip === false) {
    return button;
  }

  const tooltipText = tooltip ?? ariaLabel;
  const tooltipAddsDescription = tooltipText !== ariaLabel;

  return (
    <Tooltip
      describeChild={tooltipAddsDescription}
      text={tooltipText}
      side={tooltipSide}
    >
      {button}
    </Tooltip>
  );
}
