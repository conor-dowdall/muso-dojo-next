import { type CSSProperties } from "react";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import styles from "./InstrumentThemeSwatch.module.css";

interface InstrumentThemeSwatchFrameProps {
  background: string;
}

function InstrumentThemeSwatchFrame({
  background,
}: InstrumentThemeSwatchFrameProps) {
  return (
    <span
      aria-hidden="true"
      className={styles.themeSwatch}
      style={
        {
          "--theme-swatch-background": background,
        } as CSSProperties
      }
    />
  );
}

export function KeyboardThemeSwatch({
  themeName,
}: {
  themeName: KeyboardThemeName;
}) {
  const { blackKeyColor, whiteKeyColor } = keyboardThemes[themeName].config;
  return (
    <InstrumentThemeSwatchFrame
      background={`${whiteKeyColor} left / 35% 100% no-repeat, ${blackKeyColor} center / 30% 100% no-repeat, ${whiteKeyColor} right / 35% 100% no-repeat`}
    />
  );
}

export function FretboardThemeSwatch({
  themeName,
}: {
  themeName: FretboardThemeName;
}) {
  const background = fretboardThemes[themeName].config.background ?? "none";
  return <InstrumentThemeSwatchFrame background={background} />;
}
