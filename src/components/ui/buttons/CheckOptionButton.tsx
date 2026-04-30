import { Check } from "lucide-react";
import { Button, type ButtonLabelProps, type ButtonProps } from "./Button";
import styles from "./CheckOptionButton.module.css";

export type CheckOptionButtonProps = Omit<
  ButtonProps,
  | "accessory"
  | "icon"
  | "iconAriaHidden"
  | "iconPosition"
  | "iconSizing"
  | "label"
  | "labelProps"
  | "layout"
  | "selected"
  | "subtitle"
> & {
  label: ButtonLabelProps["label"];
  labelProps?: Omit<ButtonLabelProps, "label" | "subtitle">;
  selected: boolean;
  subtitle?: ButtonLabelProps["subtitle"];
};

export function CheckOptionButton({
  className = "",
  label,
  selected,
  subtitle,
  variant = "ghost",
  ...props
}: CheckOptionButtonProps) {
  const buttonClasses = [styles.checkOptionButton, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      {...props}
      className={buttonClasses}
      icon={
        <span className={styles.checkBox} data-selected={selected}>
          <Check aria-hidden="true" />
        </span>
      }
      iconSizing="content"
      label={label}
      layout="media"
      selected={selected}
      subtitle={subtitle}
      variant={variant}
    />
  );
}
