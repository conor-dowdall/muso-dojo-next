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
            height: "13em",
          }}
        >
          <Fretboard preset="darkGibson" />
        </div>
      </div>
    </MusicSystemProvider>
  );
}
