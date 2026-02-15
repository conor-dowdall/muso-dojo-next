"use client";

import { useState } from "react";
import Fretboard from "@/components/fretboard/Fretboard";
import { type ActiveNotes } from "@/types/fretboard/fretboard";

export default function Home() {
  const [activeNotes1, setActiveNotes1] = useState<ActiveNotes>({});
  const [activeNotes2, setActiveNotes2] = useState<ActiveNotes>({});
  const [activeNotes3, setActiveNotes3] = useState<ActiveNotes>({});

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1em",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "12em",
        }}
      >
        <Fretboard
          preset="lightTelecaster"
          rootNote="C#"
          noteCollectionKey="halfWholeDiminished"
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
          rootNote="Fb"
          noteCollectionKey="ionian"
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
    </div>
  );
}
