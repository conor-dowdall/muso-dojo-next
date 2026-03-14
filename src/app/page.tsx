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
          <Fretboard preset="darkGibson" showToolbar />
        </div>
        {/* <div style={{ width: "100%", maxWidth: "50em", height: "10em" }}>
          <Fretboard preset="lightTelecaster" config={{}} />
        </div> */}
        <div style={{ width: "100%", maxWidth: "50em", height: "10em" }}>
          <Keyboard preset="3octave" showToolbar />
        </div>
      </div>
    </MusicSystemProvider>
  );
}
