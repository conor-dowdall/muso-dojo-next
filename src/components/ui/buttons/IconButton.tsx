import { type ReactNode } from "react";
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
};

export function IconButton({
  "aria-label": ariaLabel,
  className = "",
  icon,
  ...props
}: IconButtonProps) {
  const buttonClasses = [styles.iconButton, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      {...props}
      aria-label={ariaLabel}
      className={buttonClasses}
      icon={icon}
      iconAriaHidden
    />
  );
}
