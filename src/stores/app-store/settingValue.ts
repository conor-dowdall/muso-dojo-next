import { type SettingValue } from "@/types/state";

export function resolveSettingValue<T>(
  value: SettingValue<T>,
  previousValue: T,
): T {
  return typeof value === "function"
    ? (value as (prev: T) => T)(previousValue)
    : value;
}
