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
          activeNotes={activeNotes}
          onActiveNotesChange={setActiveNotes}
        />
      </div>
    </div>
  );
}
