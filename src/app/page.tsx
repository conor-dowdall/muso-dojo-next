"use client";

import Fretboard from "@/components/fretboard/Fretboard";
import { MusicSystemProvider } from "@/context/music-theory/MusicSystemContext";

export default function Home() {
  return (
    <MusicSystemProvider>
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
        <div style={{ width: "100%", maxWidth: "20em", height: "9em" }}>
          <Fretboard
            config={{ fretRange: [0, 5] }}
            showToolbar={true}
            preset="darkGibson"
          />
        </div>
        <div style={{ width: "100%", maxWidth: "50em", height: "12em" }}>
          <Fretboard
            config={{ fretRange: [0, 5] }}
            showToolbar={true}
            preset="lightTelecaster"
          />
        </div>
        <div style={{ width: "100%", maxWidth: "50em", height: "18em" }}>
          <Fretboard config={{ fretRange: [0, 5] }} showToolbar={true} />
        </div>
      </div>
    </MusicSystemProvider>
  );
}
