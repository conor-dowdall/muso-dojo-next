import {
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import styles from "./RangeSlider.module.css";

type SliderStyle = CSSProperties & Record<`--${string}`, string | number>;

export type RangeSliderProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "children" | "type"
> & {
  label: string;
  valueLabel: ReactNode;
  valueText?: string;
};

export function RangeSlider({
  className = "",
  label,
  max,
  min,
  style,
  value,
  valueLabel,
  valueText,
  ...props
}: RangeSliderProps) {
  const sliderClasses = [styles.slider, className].filter(Boolean).join(" ");
  const resolvedValueText =
    valueText ??
    (typeof valueLabel === "string" || typeof valueLabel === "number"
      ? String(valueLabel)
      : undefined);
  const progress = getSliderProgress({ max, min, value });
  const sliderStyle =
    progress === undefined
      ? style
      : ({
          "--range-slider-progress": progress,
          ...style,
        } satisfies SliderStyle);

  return (
    <label className={styles.field}>
      <span className={styles.valueLabel}>{valueLabel}</span>
      <input
        {...props}
        aria-label={label}
        aria-valuetext={resolvedValueText}
        className={sliderClasses}
        max={max}
        min={min}
        style={sliderStyle}
        type="range"
        value={value}
      />
    </label>
  );
}

export function RangeSliderGroup({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const groupClasses = [styles.group, className].filter(Boolean).join(" ");

  return (
    <div className={groupClasses} {...props}>
      {children}
    </div>
  );
}

function getSliderProgress({
  max,
  min,
  value,
}: Pick<RangeSliderProps, "max" | "min" | "value">) {
  const numericMin = toFiniteNumber(min, 0);
  const numericMax = toFiniteNumber(max, 100);
  const numericValue = toFiniteNumber(value, numericMin);
  const distance = numericMax - numericMin;

  if (distance <= 0) {
    return undefined;
  }

  return `${clamp((numericValue - numericMin) / distance, 0, 1) * 100}%`;
}

function toFiniteNumber(value: unknown, fallback: number) {
  if (Array.isArray(value)) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
