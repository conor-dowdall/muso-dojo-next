import { type ReactNode } from "react";
import {
  Button,
  type ButtonLayout,
  type ButtonLabelProps,
  type ButtonProps,
} from "./Button";
import styles from "./OptionButton.module.css";

/**
 * App-level option/action presentations built from Button's primitive layouts.
 *
 * media: icon or visual on the left, title/subtitle beside it.
 * tile: centered title/subtitle for compact grid choices.
 * list: title/subtitle on the left, selected marker on the right.
 */
export type OptionButtonPresentation = "media" | "tile" | "list";
export type OptionButtonDensity = "compact" | "comfortable";

export type OptionButtonLabelProps = Omit<
  ButtonLabelProps,
  "label" | "subtitle"
>;

export type OptionButtonProps = Omit<
  ButtonProps,
  | "accessory"
  | "density"
  | "iconAriaHidden"
  | "label"
  | "layout"
  | "selected"
  | "size"
  | "subtitle"
  | "variant"
> & {
  density?: OptionButtonDensity;
  fullWidth?: boolean;
  icon?: ReactNode;
  label: ReactNode;
  labelProps?: OptionButtonLabelProps;
  presentation?: OptionButtonPresentation;
  selected?: boolean;
  showSelectionIndicator?: boolean;
  subtitle?: ReactNode;
  variant?: ButtonProps["variant"];
};

const presentationLayouts = {
  media: "media",
  tile: "stacked",
  list: "split",
} as const satisfies Record<OptionButtonPresentation, ButtonLayout>;

export function OptionButton({
  className = "",
  density = "comfortable",
  fullWidth = true,
  icon,
  label,
  labelProps,
  presentation = "media",
  selected,
  showSelectionIndicator,
  subtitle,
  variant = "outline",
  ...props
}: OptionButtonProps) {
  const shouldShowSelectionIndicator =
    showSelectionIndicator ?? presentation === "list";
  const buttonClasses = [
    styles.optionButton,
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      {...props}
      accessory={
        shouldShowSelectionIndicator ? (
          <span
            aria-hidden="true"
            className={`${styles.selectionIndicator} ${styles.selectionDot}`}
            data-selected={selected === true}
          />
        ) : undefined
      }
      className={buttonClasses}
      data-option-density={density}
      data-option-presentation={presentation}
      icon={icon}
      label={label}
      labelProps={labelProps}
      layout={presentationLayouts[presentation]}
      selected={selected}
      subtitle={subtitle}
      variant={variant}
    />
  );
}
