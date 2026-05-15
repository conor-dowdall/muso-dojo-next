export const fretboardIconNames = ["circle", "paw-print", "trapezoid"] as const;

export type FretboardIcon = (typeof fretboardIconNames)[number];

export function isProportionalFretboardIcon(
  icon: FretboardIcon,
): icon is Exclude<FretboardIcon, "trapezoid"> {
  return icon !== "trapezoid";
}
