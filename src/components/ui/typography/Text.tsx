import { type ElementType } from "react";
import { Typography, type TypographyProps } from "./Typography";

export type TextProps<T extends ElementType = "span"> = TypographyProps<T> & {
  as?: T;
};

export function Text<T extends "p" | "span" | "div" | "label" = "span">({
  as,
  children,
  ...props
}: TextProps<T>) {
  return (
    <Typography as={as} {...(props as TypographyProps<T>)}>
      {children}
    </Typography>
  );
}
