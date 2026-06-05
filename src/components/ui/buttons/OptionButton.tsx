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
 * tile: centered content for compact grid choices. Use text-only tiles for
 * dense verbal choices, such as display formats or note collections. Use
 * icon-over-label tiles only when the icon is the option's primary visual
 * meaning and the label names a short concrete state, such as note size.
 * list: title/subtitle on the left, preview and disclosure affordances on the
 * right.
 * Visual hierarchy contract:
 * - Setting rows keep label stable, such as "Root Note" or "Range"; put the
 *   compact current value or visual sample in preview.
 * - Choice rows use label for the choice name. If a choice opens its own
 *   settings, subtitle can summarize those settings, such as
 *   "Guitar • Standard E" or "25 Key • C3 to C5".
 * - Use subtitle for comparison details, examples, longer derived values, or
 *   plain-language help.
 * - preview is compact right-side content: current values, swatches, icons, or
 *   visual samples that benefit from fast scanning. Long explanatory text and
 *   summaries of nested actions belong in subtitle. Join compact value pairs
 *   with DISPLAY_VALUE_SEPARATOR from "@/utils/valueSummary".
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
  /**
   * Compact right-side content for visual samples or collapsed setting values.
   * Text that explains a selectable choice should usually be `subtitle`.
   */
  preview?: ReactNode;
  selected?: boolean;
  /**
   * Secondary text that belongs to the row identity: examples, descriptions,
   * resolved values, mode names, or comparison details.
   */
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
  subtitle,
  variant,
  ...props
}: OptionButtonProps) {
  const hasPreview = preview !== undefined;
  const hasAccessory = hasPreview || disclosureState !== undefined;
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
            {hasPreview ? (
              <span className={styles.preview} aria-hidden="true">
                {preview}
              </span>
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
      icon={icon}
      label={label}
      labelProps={labelProps}
      layout={presentationLayouts[presentation]}
      iconPosition={iconPosition}
      iconSizing={iconSizing}
      selected={selected}
      subtitle={subtitle}
      variant={variant}
    />
  );
}
