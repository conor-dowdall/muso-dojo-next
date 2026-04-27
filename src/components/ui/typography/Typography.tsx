import {
  type ReactNode,
  type ElementType,
  type ComponentPropsWithoutRef,
} from "react";
import styles from "./Typography.module.css";

export type TypographySize = "2xs" | "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
export type TypographyWeight =
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold";
export type TypographyVariant = "primary" | "muted" | "accent";
export type TypographyLeading =
  | "none"
  | "tightest"
  | "tighter"
  | "tight"
  | "snug"
  | "normal"
  | "relaxed"
  | "loose";

export interface TypographyBaseProps {
  size?: TypographySize;
  weight?: TypographyWeight;
  variant?: TypographyVariant;
  leading?: TypographyLeading;
  italic?: boolean;
  block?: boolean;
  caps?: boolean;
  overline?: boolean;
  className?: string;
  children: ReactNode;
}

export type TypographyProps<T extends ElementType> = TypographyBaseProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof TypographyBaseProps | "as">;

export function Typography<T extends ElementType = "span">({
  as,
  size = "base",
  weight = "normal",
  variant = "primary",
  leading,
  italic = false,
  block = false,
  caps = false,
  overline = false,
  className = "",
  children,
  ...props
}: TypographyProps<T>) {
  const Component = as || "span";

  const combinedClasses = [
    styles.base,
    size !== "base" ? styles[`size-${size}`] : "",
    weight !== "normal" ? styles[`weight-${weight}`] : "",
    variant !== "primary" ? styles[`variant-${variant}`] : "",
    leading && leading !== "normal" ? styles[`leading-${leading}`] : "",
    italic ? styles.italic : "",
    block ? styles.block : Component === "span" ? styles.inline : "",
    caps ? styles.caps : "",
    overline ? styles.overline : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component
      className={combinedClasses}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Component>
  );
}
