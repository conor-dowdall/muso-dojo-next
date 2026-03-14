import { useEffect } from "react";
import { useMusicSystem } from "@/context/music-theory/MusicSystemContext";

/**
 * Hook to handle instrument-wide keyboard shortcuts.
 * j -> hidden
 * k -> small
 * l -> large
 */
export function useInstrumentShortcuts() {
  const musicSystem = useMusicSystem();

  useEffect(() => {
    if (!musicSystem) return;

    const { setNoteEmphasis } = musicSystem;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if the user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "j":
          setNoteEmphasis("hidden");
          break;
        case "k":
          setNoteEmphasis("small");
          break;
        case "l":
          setNoteEmphasis("large");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [musicSystem]);
}
