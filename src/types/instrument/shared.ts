export type NoteLabelType = "midi" | "note-name" | "interval" | "solfege";

export interface ActiveNote {
  midi: number;
  emphasis: "large" | "small";
}

export type ActiveNotes = Record<string, ActiveNote>;
