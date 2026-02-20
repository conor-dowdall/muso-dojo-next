import { type FretboardProps } from "@/types/fretboard/fretboard";
import {
  FretboardProvider,
  useFretboardConfig,
} from "@/context/fretboard/FretboardContext";
import {
  useMusicSystem,
  MusicSystemProvider,
} from "@/context/music-theory/MusicSystemContext";
import MusicToolbar from "../toolbar/MusicToolbar";
import FretboardBackground from "./FretboardBackground";
import FretboardNotesLayer from "./FretboardNotesLayer";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import { calculateFretboardGridColumns } from "@/utils/fretboard/calculateFretboardGridColumns";

export default function Fretboard(props: FretboardProps) {
  return (
    <FretboardProvider {...props}>
      <FretboardContent {...props} />
    </FretboardProvider>
  );
}

function FretboardContent(props: FretboardProps) {
  const { showToolbar, rootNote, noteCollectionKey } = props;
  const musicSystem = useMusicSystem();

  // Effective values: Prop > Context > Default
  const initialRootNote = rootNote ?? musicSystem?.rootNote ?? "C";
  const initialNoteCollectionKey =
    noteCollectionKey ?? musicSystem?.noteCollectionKey ?? "major";

  // If showing toolbar, we wrap in a local provider.
  // We need to render the content differently depending on whether we are initializing a local provider or just consuming.
  if (showToolbar) {
    return (
      <MusicSystemProvider
        initialRootNote={initialRootNote}
        initialNoteCollectionKey={initialNoteCollectionKey}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <MusicToolbar />
          <div style={{ flex: 1 }}>
            <FretboardInner
              {...props}
              // Pass null/undefined for these so the inner component uses the context we just created
              rootNote={undefined}
              noteCollectionKey={undefined}
            />
          </div>
        </div>
      </MusicSystemProvider>
    );
  }

  return <FretboardInner {...props} />;
}

function FretboardInner(props: FretboardProps) {
  const config = useFretboardConfig();
  const numFrets = getNumFrets(config.fretRange);
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    config.evenFrets,
  );
  const isFretLabelsBottom = config.fretLabelsPosition === "bottom";

  return (
    <div
      id="fretboard-wrapper"
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateRows: isFretLabelsBottom
          ? "1fr max-content"
          : "max-content 1fr",
        gridTemplateColumns: fretboardGridColumns,
        containerType: "inline-size",
        isolation: "isolate", // Create a local stacking context
        direction: config.leftHanded ? "rtl" : "ltr",
      }}
    >
      <FretboardBackground />
      <FretboardNotesLayer {...props} />
    </div>
  );
}
