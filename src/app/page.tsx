"use client";

import { useState } from "react";
import Fretboard from "@/components/fretboard/Fretboard";
import { type ActiveNotes } from "@/types/fretboard/fretboard";

import { MusicSystemProvider } from "@/context/music-theory/MusicSystemContext";
import MusicToolbar from "@/components/toolbar/MusicToolbar";

export default function Home() {
  const [activeNotes1, setActiveNotes1] = useState<ActiveNotes>({});
  const [activeNotes2, setActiveNotes2] = useState<ActiveNotes>({});
  const [activeNotes3, setActiveNotes3] = useState<ActiveNotes>({});
  const [activeNotes4, setActiveNotes4] = useState<ActiveNotes>({});

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
          <Fretboard
            preset="lightTelecaster"
            activeNotes={activeNotes1}
            onActiveNotesChange={setActiveNotes1}
          />
        </div>
        <div
          style={{
            width: "100%",
            height: "12em",
          }}
        >
          <Fretboard
            preset="darkGibson"
            activeNotes={activeNotes2}
            onActiveNotesChange={setActiveNotes2}
          />
        </div>
        <div
          style={{
            width: "100%",
            height: "12em",
          }}
        >
          <Fretboard
            activeNotes={activeNotes3}
            onActiveNotesChange={setActiveNotes3}
          />
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
          <Fretboard
            activeNotes={activeNotes4}
            onActiveNotesChange={setActiveNotes4}
            showToolbar
          />
        </div>
      </div>
    </MusicSystemProvider>
  );
}
