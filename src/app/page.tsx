"use client";

import { useState } from "react";
import Fretboard from "@/components/instruments/fretboard/Fretboard";
import { ActiveNotes } from "@/types/fretboard";

export default function Home() {
  const [activeNotes, setActiveNotes] = useState<ActiveNotes>({});

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
          rootNote="C"
          noteCollectionKey="ionian"
          activeNotes={activeNotes}
          onActiveNotesChange={setActiveNotes}
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
          rootNote="E"
          noteCollectionKey="ionian"
          activeNotes={activeNotes}
          onActiveNotesChange={setActiveNotes}
        />
      </div>
    </div>
  );
}
