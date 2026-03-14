import { type KeyboardProps } from "@/types/keyboard/keyboard";
import {
  KeyboardProvider,
  useKeyboardConfig,
} from "@/context/keyboard/KeyboardContext";
import {
  useMusicSystem,
  MusicSystemProvider,
} from "@/context/music-theory/MusicSystemContext";
import MusicToolbar from "../toolbar/MusicToolbar";
import KeyboardBackground from "./KeyboardBackground";
import KeyboardNotesLayer from "./KeyboardNotesLayer";

export default function Keyboard(props: KeyboardProps) {
  return (
    <KeyboardProvider {...props}>
      <KeyboardContent {...props} />
    </KeyboardProvider>
  );
}

function KeyboardContent(props: KeyboardProps) {
  const {
    showToolbar,
    rootNote,
    noteCollectionKey,
    noteEmphasis: propEmphasis,
  } = props;
  const musicSystem = useMusicSystem();

  const noteEmphasis = propEmphasis ?? musicSystem?.noteEmphasis;

  // Effective values: Prop > Context > Default
  const initialRootNote = rootNote ?? musicSystem?.rootNote ?? "C";
  const initialNoteCollectionKey =
    noteCollectionKey ?? musicSystem?.noteCollectionKey ?? "major";

  if (showToolbar) {
    return (
      <MusicSystemProvider
        initialRootNote={initialRootNote}
        initialNoteCollectionKey={initialNoteCollectionKey}
      >
        <div
          data-component="Keyboard"
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
            <KeyboardInner
              {...props}
              noteEmphasis={noteEmphasis}
              rootNote={undefined}
              noteCollectionKey={undefined}
            />
          </div>
        </div>
      </MusicSystemProvider>
    );
  }

  return <KeyboardInner {...props} noteEmphasis={noteEmphasis} />;
}

function KeyboardInner(props: KeyboardProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _config = useKeyboardConfig();

  return (
    <div
      data-component="KeyboardInner"
      style={{
        container: "keyboard-inner / size",
        width: "100%",
        height: "100%",
        position: "relative",
        // a sharp note can stick out past the right edge of the keyboard
        // so we need to hide it
        overflow: "hidden",
      }}
    >
      <KeyboardBackground />
      <KeyboardNotesLayer {...props} noteEmphasis={props.noteEmphasis} />
    </div>
  );
}
