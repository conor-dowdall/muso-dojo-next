import { useKeyboardConfig } from "@/context/keyboard/KeyboardContext";
import {
  isBlackKey,
  countWhiteKeys,
  getBlackKeyOffset,
} from "@/utils/keyboard/keyboardLayout";

export default function KeyboardBackground() {
  const config = useKeyboardConfig();
  const [startMidi, endMidi] = config.midiRange;
  const numWhiteKeys = countWhiteKeys(startMidi, endMidi);
  const whiteKeyWidth = `${100 / numWhiteKeys}%`;
  const blackKeyWidth = `${(100 / numWhiteKeys) * config.blackKeyWidthRatio}%`;

  // Separate white and black keys for proper z-ordering
  const whiteKeys: Array<{ midi: number; left: string }> = [];
  const blackKeys: Array<{ midi: number; left: string }> = [];

  let whiteKeyIndex = 0;

  for (let midi = startMidi; midi <= endMidi; midi++) {
    if (isBlackKey(midi)) {
      const offset = getBlackKeyOffset(midi);
      const leftPercent =
        (whiteKeyIndex / numWhiteKeys) * 100 + (offset * 100) / numWhiteKeys;
      blackKeys.push({ midi, left: `${leftPercent}%` });
    } else {
      whiteKeys.push({
        midi,
        left: `${(whiteKeyIndex / numWhiteKeys) * 100}%`,
      });
      whiteKeyIndex++;
    }
  }

  return (
    <div
      data-component="KeyboardBackground"
      style={{
        position: "absolute",
        inset: 0,
        background: config.background,
      }}
    >
      {/* White keys layer */}
      {whiteKeys.map(({ midi, left }) => (
        <div
          key={midi}
          style={{
            position: "absolute",
            left,
            top: 0,
            width: whiteKeyWidth,
            height: "100%",
            boxSizing: "border-box",
            background: config.whiteKeyColor,
            borderRight: `1px solid ${config.keyBorderColor}`,
            borderBottom: `3px solid ${config.keyBorderColor}`,
            borderRadius: config.keyBorderRadius,
          }}
        />
      ))}

      {/* Black keys layer (rendered on top) */}
      {blackKeys.map(({ midi, left }) => (
        <div
          key={midi}
          style={{
            position: "absolute",
            left,
            top: 0,
            width: blackKeyWidth,
            height: `${config.blackKeyHeightPercent}%`,
            boxSizing: "border-box",
            background: config.blackKeyColor,
            borderRadius: config.keyBorderRadius,
            borderBottom: `2px solid ${config.keyBorderColor}`,
          }}
        />
      ))}
    </div>
  );
}
