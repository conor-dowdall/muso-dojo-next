import { useCallback, useState } from "react";
import { type SettingSetter, type SettingValue } from "@/types/state";

interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue: T;
  onChange?: SettingSetter<T>;
  controlled?: boolean;
}

function resolveSettingValue<T>(value: SettingValue<T>, previousValue: T): T {
  return typeof value === "function"
    ? (value as (prev: T) => T)(previousValue)
    : value;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  controlled,
}: UseControllableStateOptions<T>): [T, SettingSetter<T>] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlled ?? value !== undefined;
  const currentValue = isControlled ? (value ?? defaultValue) : internalValue;

  const setValue = useCallback<SettingSetter<T>>(
    (nextValue) => {
      const resolvedValue = resolveSettingValue(nextValue, currentValue);

      if (!isControlled) {
        setInternalValue(resolvedValue);
      }

      onChange?.(resolvedValue);
    },
    [currentValue, isControlled, onChange],
  );

  return [currentValue, setValue];
}
