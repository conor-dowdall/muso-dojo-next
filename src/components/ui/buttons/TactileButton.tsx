import { type MouseEvent, type PointerEvent } from "react";
import { IconButton, type IconButtonProps } from "./IconButton";
import interactiveSurfaceStyles from "@/components/ui/interactive-surface/InteractiveSurface.module.css";
import styles from "./TactileButton.module.css";

interface TactileInteractionProps {
  /**
   * Fires on primary pointerdown for immediate controls, while preserving
   * keyboard and assistive-technology activation through click.
   */
  onPress: () => void;
  /**
   * Keeps the control physically pressable but prevents its action.
   */
  unavailable?: boolean;
}

type TactileControlState = "idle" | "selected" | "unavailable";

export type TactileIconButtonProps = Omit<
  IconButtonProps,
  "aria-disabled" | "disabled" | "onClick" | "onPointerDown" | "shouldYield"
> &
  TactileInteractionProps;

function getTactileInteractionProps({
  onPress,
  unavailable = false,
}: TactileInteractionProps) {
  return {
    "aria-disabled": unavailable ? true : undefined,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      // Keyboard and assistive-technology clicks have no pointer click count.
      if (!unavailable && event.detail === 0) {
        onPress();
      }
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (!unavailable && event.isPrimary && event.button === 0) {
        onPress();
      }
    },
    shouldYield: false,
  } as const;
}

function getClassName(className: string | undefined) {
  return [
    interactiveSurfaceStyles.surface,
    interactiveSurfaceStyles.neutral,
    interactiveSurfaceStyles.raised,
    interactiveSurfaceStyles.selfInteractive,
    styles.tactileButton,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function getControlState(
  selected: boolean | undefined,
  unavailable: boolean | undefined,
): TactileControlState {
  if (unavailable) return "unavailable";
  return selected ? "selected" : "idle";
}

export function TactileIconButton({
  className,
  icon,
  onPress,
  selected,
  tooltip = false,
  unavailable,
  ...props
}: TactileIconButtonProps) {
  return (
    <IconButton
      {...props}
      {...getTactileInteractionProps({ onPress, unavailable })}
      className={getClassName(className)}
      data-control-state={getControlState(selected, unavailable)}
      icon={icon}
      selected={selected}
      tooltip={tooltip}
    />
  );
}
