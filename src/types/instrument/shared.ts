export interface ActiveNote {
  midi: number;
  emphasis?: "large" | "small" | "hidden";
}

export type ActiveNotes = Record<string, ActiveNote>;
