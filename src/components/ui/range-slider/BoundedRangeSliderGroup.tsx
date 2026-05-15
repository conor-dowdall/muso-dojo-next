"use client";

import {
  RangeSlider,
  RangeSliderGroup,
} from "@/components/ui/range-slider/RangeSlider";
import {
  normalizeBoundedRange,
  type NumericRange,
} from "@/utils/range/numberRange";

interface BoundedRangeSliderGroupProps {
  endLabel: string;
  max: number;
  min: number;
  minSpan: number;
  onChange: (value: NumericRange) => void;
  startLabel: string;
  value: NumericRange;
  valueFormatter: (value: number) => string;
}

export function BoundedRangeSliderGroup({
  endLabel,
  max,
  min,
  minSpan,
  onChange,
  startLabel,
  value,
  valueFormatter,
}: BoundedRangeSliderGroupProps) {
  const [start, end] = value;

  const setStart = (nextStart: number) => {
    if (!Number.isFinite(nextStart)) return;

    onChange(
      normalizeBoundedRange([nextStart, Math.max(nextStart + minSpan, end)], {
        min,
        max,
        minSpan,
      }),
    );
  };

  const setEnd = (nextEnd: number) => {
    if (!Number.isFinite(nextEnd)) return;

    onChange(
      normalizeBoundedRange([Math.min(start, nextEnd - minSpan), nextEnd], {
        min,
        max,
        minSpan,
      }),
    );
  };

  return (
    <RangeSliderGroup>
      <RangeSlider
        label={startLabel}
        max={max}
        min={min}
        value={start}
        valueLabel={valueFormatter(start)}
        onChange={(event) => setStart(event.currentTarget.valueAsNumber)}
      />
      <RangeSlider
        label={endLabel}
        max={max}
        min={min}
        value={end}
        valueLabel={valueFormatter(end)}
        onChange={(event) => setEnd(event.currentTarget.valueAsNumber)}
      />
    </RangeSliderGroup>
  );
}
