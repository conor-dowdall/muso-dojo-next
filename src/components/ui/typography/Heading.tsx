import { type ElementType } from "react";
import { Typography, type TypographyProps } from "./Typography";

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type HeadingProps<T extends ElementType = "h2"> = TypographyProps<T> & {
  as?: HeadingTag;
};

/**
 * !!! LLM COPY CONVENTION: Heading text is an app title/section title.
 * Prefer Title Case for visible headings and dialog titles, leaving minor
 * words lowercase unless first/last: "Instrument Options", "Choose Root Note".
 * Preserve user-authored names and music/content labels as their source data
 * supplies them.
 * Tooltips are intentionally different; keep tooltip text in sentence case.
 */
export function Heading<T extends HeadingTag = "h2">({
  as,
  children,
  leading = "tight",
  ...props
}: HeadingProps<T>) {
  const Component = (as || "h2") as T;

  return (
    <Typography
      as={Component}
      leading={leading}
      {...(props as TypographyProps<T>)}
    >
      {children}
    </Typography>
  );
}
