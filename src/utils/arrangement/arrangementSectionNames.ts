function formatAlphabeticIndex(index: number) {
  let value = Math.max(0, Math.floor(index)) + 1;
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}

export function formatArrangementSectionName(index: number) {
  return `Section ${formatAlphabeticIndex(index)}`;
}

export function createDefaultArrangementSectionName(
  existingNames: Iterable<string>,
) {
  const names = Array.from(existingNames);
  const normalizedNames = new Set(
    names.map((name) => name.trim().toLocaleLowerCase()),
  );
  let index = names.length;
  let name = formatArrangementSectionName(index);

  while (normalizedNames.has(name.toLocaleLowerCase())) {
    index += 1;
    name = formatArrangementSectionName(index);
  }

  return name;
}
