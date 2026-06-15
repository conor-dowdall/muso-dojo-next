import {
  TactileIconButton,
  type TactileIconButtonProps,
} from "@/components/ui/buttons/TactileButton";
import styles from "./PartModuleControls.module.css";

type PartModuleControlProminence = "standard" | "primary";

export type PartModuleControlButtonProps = Omit<
  TactileIconButtonProps,
  "size"
> & {
  prominence?: PartModuleControlProminence;
};

export function PartModuleControlButton({
  className = "",
  prominence = "standard",
  ...props
}: PartModuleControlButtonProps) {
  const buttonClasses = [
    styles.button,
    prominence === "primary" ? styles.primaryButton : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <TactileIconButton {...props} className={buttonClasses} size="md" />;
}
