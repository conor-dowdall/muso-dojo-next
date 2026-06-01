import { DEFAULT_NOTE_COLOR_VALUES } from "@/data/noteColors";
import styles from "./SessionLoader.module.css";

const primaryWavePath =
  "M8 36 C 20 12, 32 12, 44 36 S 68 60, 80 36 S 104 12, 120 36";
const harmonicWavePath =
  "M8 36 C 17.333 12, 26.667 12, 36 36 S 54.667 60, 64 36 S 82.667 12, 92 36 S 110.667 60, 120 36";

const pitchPoints = [
  ["8", "36"],
  ["18.182", "17.807"],
  ["28.364", "20.885"],
  ["38.545", "41.635"],
  ["48.727", "55.796"],
  ["58.909", "46.813"],
  ["69.091", "25.187"],
  ["79.273", "16.204"],
  ["89.455", "30.365"],
  ["99.636", "51.115"],
  ["109.818", "54.193"],
  ["120", "36"],
] as const;

const waveGradientStops = [
  { offset: "0%", pitchIndex: 0 },
  { offset: "24%", pitchIndex: 4 },
  { offset: "48%", pitchIndex: 7 },
  { offset: "72%", pitchIndex: 2 },
  { offset: "100%", pitchIndex: 9 },
] as const;

export function SessionLoader() {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.statusText}>Loading Session</span>
      <span className={styles.mark} aria-hidden="true">
        <svg
          className={styles.waveMark}
          viewBox="0 0 128 72"
          focusable="false"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="session-loader-wave"
              x1="0"
              x2="1"
              y1="0"
              y2="0"
            >
              {waveGradientStops.map(({ offset, pitchIndex }) => (
                <stop
                  key={pitchIndex}
                  offset={offset}
                  stopColor={DEFAULT_NOTE_COLOR_VALUES[pitchIndex]}
                />
              ))}
            </linearGradient>
          </defs>
          <path className={styles.waveEcho} d={primaryWavePath} />
          <path className={styles.waveLine} d={primaryWavePath} />
          <path className={styles.wavePulse} d={primaryWavePath} />
          <path className={styles.waveHarmonic} d={harmonicWavePath} />
          {pitchPoints.map(([x, y], pitchClass) => (
            <circle
              key={pitchClass}
              className={styles.pitchPoint}
              cx={x}
              cy={y}
              r="3"
              style={{ color: DEFAULT_NOTE_COLOR_VALUES[pitchClass] }}
            />
          ))}
        </svg>
      </span>
    </div>
  );
}
