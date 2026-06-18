export function setPointerModality(element: HTMLElement, pointerType: string) {
  element.dataset.pointerModality = pointerType || "mouse";
}
