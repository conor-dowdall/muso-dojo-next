export interface PointerActivation {
  button: number;
  isPrimary: boolean;
}

export function isPrimaryPointerActivation(event: PointerActivation) {
  return event.isPrimary && event.button === 0;
}
