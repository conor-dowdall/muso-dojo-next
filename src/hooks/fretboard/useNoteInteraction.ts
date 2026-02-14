import { type ActiveNotes, type ActiveNote } from "@/types/fretboard";

interface UseNoteInteractionProps {
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: (notes: ActiveNotes) => void;
}

export function useNoteInteraction({
  activeNotes,
  onActiveNotesChange,
}: UseNoteInteractionProps) {
  const handleNoteClick = (
    stringIndex: number,
    fretNumber: number,
    openStringMidi: number,
  ) => {
    if (!onActiveNotesChange || !activeNotes) return;

    const key = `${stringIndex}-${fretNumber}`;

    // Toggle logic
    // Logic: Undefined -> Large -> Small -> Undefined
    const current = activeNotes[key];
    let next: ActiveNote | undefined = undefined;

    if (!current) {
      next = {
        midi: openStringMidi + fretNumber,
        emphasis: "large",
      };
    } else if (current.emphasis === "large") {
      next = { ...current, emphasis: "small" };
    }

    const newNotes = { ...activeNotes };
    if (next) {
      newNotes[key] = next;
    } else {
      delete newNotes[key];
    }

    onActiveNotesChange(newNotes);
  };

  return { handleNoteClick };
}
