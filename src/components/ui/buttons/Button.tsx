import { yieldToPaint } from "@/utils/browser/yieldToPaint";
import { type FC, type MouseEvent, type ReactNode } from "react";
import styles from "./Button.module.css";
import {
  Typography,
  type TypographyLeading,
  type TypographyProps,
  type TypographySize,
  type TypographyVariant,
  type TypographyWeight,
} from "../typography/Typography";

/**
 * Low-level content layouts for the Button primitive.
 *
 * inline: content sits in one centered row.
 * stacked: content sits in one centered column.
 * media: icon or visual on the left, text beside it.
 * split: main content on the left, secondary content on the right.
 *
 * Use named content slots for consistency: icon, label, subtitle, accessory.
 * OptionButton provides app-level selected option presentations on top.
 */
export type ButtonLayout = "inline" | "stacked" | "media" | "split";
export type ButtonDensity = "compact" | "standard" | "spacious";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonTone = "neutral" | "danger";
export type ButtonVariant = "filled" | "outline" | "ghost";

const buttonTitleSizes = {
  xs: "xs",
  sm: "sm",
  md: "base",
  lg: "base",
  xl: "lg",
} as const satisfies Record<ButtonSize, TypographySize>;

export type ButtonProps = Omit<
  TypographyProps<"button">,
  "as" | "aria-pressed" | "children" | "size" | "title" | "variant"
> & {
  accessory?: ReactNode;
  density?: ButtonDensity;
  icon?: ReactNode;
  iconAriaHidden?: boolean;
  iconPosition?: "start" | "end";
  iconSizing?: "fixed" | "content";
  label?: ReactNode;
  labelProps?: Omit<ButtonLabelProps, "label" | "subtitle">;
  layout?: ButtonLayout;
  selected?: boolean;
  size?: ButtonSize;
  subtitle?: ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  shouldYield?: boolean;
};

export interface ButtonLabelProps {
  className?: string;
  label: ReactNode;
  subtitle?: ReactNode;
  titleSize?: TypographySize;
  subtitleSize?: TypographySize;
  titleWeight?: TypographyWeight;
  subtitleVariant?: TypographyVariant;
  leading?: TypographyLeading;
}

export function ButtonLabel({
  className = "",
  label,
  subtitle,
  titleSize = "base",
  subtitleSize = "xs",
  titleWeight = "medium",
  subtitleVariant = "muted",
  leading,
}: ButtonLabelProps) {
  const labelClasses = [styles.buttonLabel, className]
    .filter(Boolean)
    .join(" ");
  const resolvedLeading =
    leading ?? (subtitle === undefined ? "none" : "tight");

  return (
    <span className={labelClasses}>
      <Typography
        as="span"
        block
        className={styles.buttonLabelTitle}
        leading={resolvedLeading}
        size={titleSize}
        weight={titleWeight}
      >
        {label}
      </Typography>
      {subtitle !== undefined && (
        <Typography
          as="span"
          block
          className={styles.buttonLabelSubtitle}
          leading={resolvedLeading}
          size={subtitleSize}
          variant={subtitleVariant}
        >
          {subtitle}
        </Typography>
      )}
    </span>
  );
}

export const Button: FC<ButtonProps> = ({
  accessory,
  className = "",
  density = "standard",
  icon,
  iconAriaHidden,
  iconPosition = "start",
  iconSizing = "fixed",
  label,
  labelProps,
  layout = "inline",
  selected,
  size = "md",
  subtitle,
  tone = "neutral",
  variant = "outline",
  type = "button",
  shouldYield = true,
  onClick,
  style,
  ...props
}) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    if (shouldYield && onClick) {
      yieldToPaint(() => {
        onClick(e);
        target.blur();
      });
    } else {
      onClick?.(e);
      target.blur();
    }
  };

  const buttonClasses = [
    styles.button,
    styles.interactable,
    styles[variant],
    styles[layout],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const hasVisibleText = label !== undefined || subtitle !== undefined;
  const resolvedIconAriaHidden = iconAriaHidden ?? hasVisibleText;
  const iconNode =
    icon !== undefined ? (
      <span
        className={styles.buttonIcon}
        aria-hidden={resolvedIconAriaHidden ? true : undefined}
        data-sizing={iconSizing}
      >
        {icon}
      </span>
    ) : null;
  const labelNode =
    label !== undefined || subtitle !== undefined ? (
      <ButtonLabel
        titleSize={buttonTitleSizes[size]}
        {...labelProps}
        label={label ?? ""}
        subtitle={subtitle}
      />
    ) : null;
  const accessoryNode =
    accessory !== undefined ? (
      <span className={styles.buttonAccessory} aria-hidden="true">
        {accessory}
      </span>
    ) : null;
  const mainContent = (
    <span className={styles.buttonMain}>
      {iconPosition === "end" ? (
        <>
          {labelNode}
          {iconNode}
        </>
      ) : (
        <>
          {iconNode}
          {labelNode}
        </>
      )}
    </span>
  );

  return (
    <Typography
      as="button"
      data-density={density}
      data-layout={layout}
      data-size={size}
      data-tone={tone}
      size={buttonTitleSizes[size]}
      type={type}
      className={buttonClasses}
      aria-pressed={selected}
      onClick={handleClick}
      style={style}
      {...props}
    >
      {mainContent}
      {accessoryNode}
    </Typography>
  );
};

export default Button;
