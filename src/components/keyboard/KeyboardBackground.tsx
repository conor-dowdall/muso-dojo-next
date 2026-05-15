import { type CSSProperties } from "react";
import { useKeyboardGeometry } from "./KeyboardContext";
import styles from "./Keyboard.module.css";

export function KeyboardBackground() {
  const geometry = useKeyboardGeometry();
  const {
    whiteKeys,
    blackKeys,
    whiteKeyWidth,
    blackKeyWidth,
    whiteKeyColor,
    blackKeyColor,
    whiteKeyBorderColor,
    blackKeyBorderColor,
    keyBorderRadius,
    whiteKeyShadow,
    blackKeyShadow,
  } = geometry;

  return (
    <div className={styles.keyboardBackground}>
      {whiteKeys.map(({ midi, left }) => (
        <div
          key={midi}
          className={styles.whiteKey}
          style={
            {
              "--left": left,
              "--width": whiteKeyWidth,
              "--bg": whiteKeyColor,
              "--border-color": whiteKeyBorderColor,
              "--border-radius": keyBorderRadius,
              "--shadow": whiteKeyShadow,
            } as CSSProperties
          }
        />
      ))}

      {blackKeys.map(({ midi, left, height }) => (
        <div
          key={midi}
          className={styles.blackKey}
          style={
            {
              "--left": left,
              "--width": blackKeyWidth,
              "--height": height,
              "--bg": blackKeyColor,
              "--border-radius": keyBorderRadius,
              "--border-color": blackKeyBorderColor,
              "--shadow": blackKeyShadow,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
