"use client";

import Fretboard from "@/components/fretboard/Fretboard";
import Keyboard from "@/components/keyboard/Keyboard";
import MusicToolbar from "@/components/toolbar/MusicToolbar";
import { MusicSystemProvider } from "@/context/music-theory/MusicSystemContext";

export default function Home() {
  return (
    <MusicSystemProvider>
      <div style={{ width: "100%", maxWidth: "50em" }}>
        <MusicToolbar />
      </div>
      <div
        data-component="Home"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1em",
          alignItems: "start",
          padding: "1em 2em",
        }}
      >
        <div style={{ width: "100%", maxWidth: "50em", height: "10em" }}>
          <Fretboard preset="darkGibson" />
        </div>
        <div style={{ width: "100%", maxWidth: "50em", height: "10em" }}>
          <Keyboard config={{ midiRange: [48, 85] }} />
        </div>
      </div>
    </MusicSystemProvider>
  );
}
