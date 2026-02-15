"use client";

import { useMusicSystem } from "@/context/music-theory/MusicSystemContext";
import {
  enharmonicRootNoteGroups,
  groupedNoteCollections,
  noteCollectionGroupsMetadata,
  type NoteCollectionKey,
  type NoteCollectionGroupKey,
} from "@musodojo/music-theory-data";
import { useState, useRef, useEffect } from "react";

export default function MusicToolbar() {
  const musicSystem = useMusicSystem();

  if (!musicSystem) {
    return null;
  }

  const { rootNote, setRootNote, noteCollectionKey, setNoteCollectionKey } =
    musicSystem;

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        background: "var(--background-secondary, #f0f0f0)", // Light background
        borderRadius: "8px",
        alignItems: "center",
        flexWrap: "wrap",
        color: "black", // Force black text for this container
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label
          style={{
            fontSize: "0.8rem",
            fontWeight: "bold",
            color: "#666", // Visible on light background
          }}
        >
          Root Note
        </label>
        <RootNoteSelector value={rootNote} onChange={setRootNote} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label
          style={{
            fontSize: "0.8rem",
            fontWeight: "bold",
            color: "#666", // Visible on light background
          }}
        >
          Key / Scale
        </label>
        <select
          value={noteCollectionKey}
          onChange={(e) =>
            setNoteCollectionKey(e.target.value as NoteCollectionKey)
          }
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: "white",
            color: "#666", // Explicit black text
          }}
        >
          {(
            Object.keys(groupedNoteCollections) as NoteCollectionGroupKey[]
          ).map((groupKey) => {
            const groupMetadata = noteCollectionGroupsMetadata[groupKey];
            const groupCollections = groupedNoteCollections[groupKey];
            return (
              <optgroup key={groupKey} label={groupMetadata.displayName}>
                {Object.entries(groupCollections).map(([key, collection]) => (
                  <option key={key} value={key}>
                    {collection.primaryName}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>
    </div>
  );
}

function RootNoteSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (note: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          borderRadius: "4px",
          border: "1px solid #ccc",
          background: "white",
          color: "black", // Explicit black text
          cursor: "pointer",
          textAlign: "left",
          minWidth: "4rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        type="button"
      >
        <span>{value}</span>
        <span style={{ fontSize: "0.8em", marginLeft: "0.5em" }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 1000,
            marginTop: "0.25rem",
            background: "white",
            color: "black", // Explicit black text
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "0.5rem",
            display: "grid",
            gridTemplateRows: "repeat(12, auto)", // 12 rows for pitch classes
            gap: "0.25rem",
            maxHeight: "20rem",
            overflowY: "auto",
          }}
        >
          {enharmonicRootNoteGroups.map((group, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "0.25rem",
                justifyContent: "flex-start",
              }}
            >
              {group.map((note) => (
                <button
                  key={note}
                  onClick={() => {
                    onChange(note);
                    setIsOpen(false);
                  }}
                  type="button"
                  style={{
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    background: value === note ? "#e0e7ff" : "white",
                    color: value === note ? "#4f46e5" : "inherit",
                    fontWeight: value === note ? "bold" : "normal",
                    cursor: "pointer",
                    minWidth: "2.5rem",
                    textAlign: "center",
                  }}
                >
                  {note}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
