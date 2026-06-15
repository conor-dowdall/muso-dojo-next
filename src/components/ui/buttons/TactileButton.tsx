import { type MouseEvent, type PointerEvent } from "react";
import { IconButton, type IconButtonProps } from "./IconButton";
import interactiveSurfaceStyles from "@/components/ui/interactive-surface/InteractiveSurface.module.css";
import { isPrimaryPointerActivation } from "@/utils/interaction/isPrimaryPointerActivation";
import styles from "./TactileButton.module.css";

interface TactileInteractionProps {
  /**
   * Fires on primary pointerdown for immediate controls, while preserving
   * keyboard and assistive-technology activation through click.
   */
  onPress: () => void;
  /**
   * Keeps the control physically pressable but prevents its primary action.
   */
  unavailable?: boolean;
  /**
   * Optional feedback action for an unavailable control.
   */
  onUnavailablePress?: () => void;
}

type TactileControlState = "idle" | "selected" | "unavailable";

export type TactileIconButtonProps = Omit<
  IconButtonProps,
  "aria-disabled" | "disabled" | "onClick" | "onPointerDown" | "shouldYield"
> &
  TactileInteractionProps;

function getTactileInteractionProps({
  onPress,
  onUnavailablePress,
  unavailable = false,
}: TactileInteractionProps) {
  const press = unavailable ? onUnavailablePress : onPress;

  return {
    "aria-disabled": unavailable ? true : undefined,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      // Keyboard and assistive-technology clicks have no pointer click count.
      if (event.detail === 0) {
        press?.();
      }
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (isPrimaryPointerActivation(event)) {
        press?.();
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
  onUnavailablePress,
  selected,
  tooltip = false,
  unavailable,
  ...props
}: TactileIconButtonProps) {
  return (
    <IconButton
      {...props}
      {...getTactileInteractionProps({
        onPress,
        onUnavailablePress,
        unavailable,
      })}
      className={getClassName(className)}
      data-control-state={getControlState(selected, unavailable)}
      icon={icon}
      selected={unavailable ? false : selected}
      tooltip={tooltip}
    />
  );
}
