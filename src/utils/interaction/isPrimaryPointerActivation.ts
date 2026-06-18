export interface PointerActivation {
  button: number;
  isPrimary: boolean;
  pointerType?: string;
}

export function isPrimaryPointerActivation(event: PointerActivation) {
  return event.isPrimary && event.button === 0;
}

export function isInstrumentNotePointerActivation(event: PointerActivation) {
  return (
    event.button === 0 && (event.isPrimary || event.pointerType === "touch")
  );
}
