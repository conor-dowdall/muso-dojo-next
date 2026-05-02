import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
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
 * preview: compact right-side metadata or visual for list choices.
 */
export type OptionButtonPresentation = "media" | "tile" | "list";
export type OptionButtonDensity = "compact" | "comfortable";
export type OptionButtonDisclosureState = "open" | "closed";

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
  disclosureState?: OptionButtonDisclosureState;
  fullWidth?: boolean;
  icon?: ReactNode;
  label: ReactNode;
  labelProps?: OptionButtonLabelProps;
  presentation?: OptionButtonPresentation;
  preview?: ReactNode;
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
  disclosureState,
  fullWidth = true,
  icon,
  iconPosition,
  iconSizing,
  label,
  labelProps,
  presentation = "media",
  preview,
  selected,
  showSelectionIndicator,
  subtitle,
  variant,
  ...props
}: OptionButtonProps) {
  const shouldShowSelectionIndicator =
    showSelectionIndicator ?? presentation === "list";
  const hasPreview = preview !== undefined;
  const hasAccessory =
    shouldShowSelectionIndicator || disclosureState !== undefined;
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
        hasAccessory ? (
          <span className={styles.accessoryGroup}>
            {shouldShowSelectionIndicator ? (
              <span
                aria-hidden="true"
                className={`${styles.selectionIndicator} ${styles.selectionDot}`}
                data-selected={selected === true}
              />
            ) : null}
            {disclosureState !== undefined ? (
              <span
                aria-hidden="true"
                className={styles.disclosureIndicator}
                data-state={disclosureState}
              >
                <ChevronRight />
              </span>
            ) : null}
          </span>
        ) : undefined
      }
      className={buttonClasses}
      data-option-density={density}
      data-option-presentation={presentation}
      icon={
        hasPreview ? <span className={styles.preview}>{preview}</span> : icon
      }
      label={label}
      labelProps={labelProps}
      layout={presentationLayouts[presentation]}
      iconPosition={hasPreview ? "end" : iconPosition}
      iconSizing={hasPreview ? "content" : iconSizing}
      selected={selected}
      subtitle={subtitle}
      variant={variant}
    />
  );
}
