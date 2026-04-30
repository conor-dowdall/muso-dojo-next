import { type CSSProperties } from "react";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import { assetUrl } from "@/utils/assets/assetPath";
import styles from "./InstrumentThemeSwatch.module.css";

export function KeyboardThemeSwatch({
  themeName,
}: {
  themeName: KeyboardThemeName;
}) {
  const {
    blackKeyBorderColor,
    blackKeyColor,
    blackKeyShadow,
    keyBorderRadius,
    whiteKeyBorderColor,
    whiteKeyColor,
    whiteKeyShadow,
  } = keyboardThemes[themeName].config;

  return (
    <span
      aria-hidden="true"
      className={styles.keyboardSwatch}
      style={
        {
          "--keyboard-swatch-black-key-background": blackKeyColor,
          "--keyboard-swatch-black-key-border": blackKeyBorderColor,
          "--keyboard-swatch-black-key-shadow": blackKeyShadow,
          "--keyboard-swatch-key-radius": keyBorderRadius,
          "--keyboard-swatch-white-key-background": whiteKeyColor,
          "--keyboard-swatch-white-key-border": whiteKeyBorderColor,
          "--keyboard-swatch-white-key-shadow": whiteKeyShadow,
        } as CSSProperties
      }
    >
      <span className={styles.keyboardSwatchWhiteKey} />
      <span className={styles.keyboardSwatchWhiteKey} />
      <span className={styles.keyboardSwatchWhiteKey} />
      <span className={styles.keyboardSwatchWhiteKey} />
      <span className={styles.keyboardSwatchBlackKey} data-position="1" />
      <span className={styles.keyboardSwatchBlackKey} data-position="2" />
      <span className={styles.keyboardSwatchBlackKey} data-position="3" />
    </span>
  );
}

export function FretboardThemeSwatch({
  themeName,
}: {
  themeName: FretboardThemeName;
}) {
  const {
    background,
    fretWireColor = "#cfd8dc",
    nutColor = "#ddd4c8",
    stringColor = "#b6a5a1",
  } = fretboardThemes[themeName].config;

  return (
    <span
      aria-hidden="true"
      className={styles.fretboardSwatch}
      style={
        {
          "--fretboard-swatch-background": background ?? "none",
          "--fretboard-swatch-fret-color": fretWireColor,
          "--fretboard-swatch-nut-color": nutColor,
          "--fretboard-swatch-string-color": stringColor,
          "--fretboard-swatch-string-texture": assetUrl(
            "/textures/wound-string.svg",
          ),
        } as CSSProperties
      }
    >
      <span className={styles.fretboardSwatchNut} />
      <span className={styles.fretboardSwatchFret} />
      <span className={styles.fretboardSwatchString} />
    </span>
  );
}
