"use client";

import Fretboard from "@/components/fretboard/Fretboard";

import { MusicSystemProvider } from "@/context/music-theory/MusicSystemContext";
import MusicToolbar from "@/components/toolbar/MusicToolbar";

export default function Home() {
  return (
    <MusicSystemProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1em",
          alignItems: "center",
          justifyContent: "center",
          padding: "1em",
        }}
      >
        <div style={{ width: "100%", maxWidth: "50em" }}>
          <MusicToolbar />
        </div>

        <div
          style={{
            width: "100%",
            height: "12em",
          }}
        >
          <Fretboard preset="lightTelecaster" />
        </div>
        <h3 style={{ alignSelf: "start", color: "#888", fontSize: "0.9em" }}>
          G Major Scale
        </h3>
        <div
          style={{
            width: "100%",
            height: "12em",
          }}
        >
          <Fretboard
            preset="darkGibson"
            rootNote="G"
            noteCollectionKey="major"
          />
        </div>
        <div
          style={{
            width: "100%",
            height: "12em",
          }}
        >
          <Fretboard />
        </div>
        <div
          style={{
            width: "100%",
            height: "16em", // Slightly taller for the toolbar
            border: "1px solid #333",
            padding: "0.5em",
            borderRadius: "0.5em",
          }}
        >
          <h3
            style={{ margin: "0 0 0.5em 0", color: "#888", fontSize: "0.9em" }}
          >
            Independent Fretboard with Local Toolbar
          </h3>
          <Fretboard showToolbar />
        </div>
      </div>
    </MusicSystemProvider>
  );
}
