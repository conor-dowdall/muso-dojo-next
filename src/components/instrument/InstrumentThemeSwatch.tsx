import { type CSSProperties } from "react";
import { type StringInstrumentKey } from "@musodojo/music-theory-data";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import {
  fretboardInlayPresets,
  type FretboardInlayPresetName,
} from "@/data/fretboard/inlayPresets";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import { fretboardIcons } from "@/components/fretboard/icons";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";
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
        } as CSSProperties
      }
    >
      <span className={styles.fretboardSwatchNut} />
      <span className={styles.fretboardSwatchFret} />
      <span className={styles.fretboardSwatchStrings}>
        <span className={styles.fretboardSwatchString} />
        <span className={styles.fretboardSwatchString} />
        <span className={styles.fretboardSwatchString} />
      </span>
    </span>
  );
}

export function FretboardInlayPresetSwatch({
  handedness = "right",
  instrument,
  presetName,
  size = "compact",
  themeName,
}: {
  handedness?: "right" | "left";
  instrument: StringInstrumentKey;
  presetName: FretboardInlayPresetName;
  size?: "compact" | "featured";
  themeName: FretboardThemeName;
}) {
  const previewConfig = createFretboardConfig(themeName, {
    instrument,
    ...fretboardInlayPresets[presetName].config,
  });
  const showMarker = previewConfig.showFretInlays;
  const showSecondaryFret = size === "featured";
  const markerShape = previewConfig.fretInlayImage;
  const MarkerIcon = fretboardIcons[markerShape];

  return (
    <span
      aria-hidden="true"
      className={`${styles.fretboardSwatch} ${styles.inlayPresetSwatch}`}
      data-handedness={handedness}
      data-preset={presetName}
      data-size={size}
      style={
        {
          "--fretboard-swatch-background": previewConfig.background,
          "--fretboard-swatch-fret-color": previewConfig.fretWireColor,
          "--fretboard-swatch-nut-color": previewConfig.nutColor,
          "--fretboard-swatch-string-color": previewConfig.stringColor,
          "--inlay-preset-marker-color": previewConfig.fretInlayColor,
        } as CSSProperties
      }
    >
      <span className={styles.fretboardSwatchNut} />
      <span className={styles.fretboardSwatchFret} />
      {showSecondaryFret ? (
        <span
          className={styles.fretboardSwatchFret}
          data-position="secondary"
        />
      ) : null}
      {showMarker ? (
        <span className={styles.inlayPresetMarker} data-shape={markerShape}>
          <MarkerIcon
            className={styles.inlayPresetMarkerIcon}
            color="currentColor"
            fill="currentColor"
            strokeWidth={0}
            preserveAspectRatio={
              markerShape === "trapezoid" ? "none" : "xMidYMid meet"
            }
          />
        </span>
      ) : null}
      <span className={styles.fretboardSwatchStrings}>
        <span className={styles.fretboardSwatchString} />
        <span className={styles.fretboardSwatchString} />
        <span className={styles.fretboardSwatchString} />
      </span>
    </span>
  );
}
