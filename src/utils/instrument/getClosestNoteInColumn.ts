export function getClosestNoteInColumn<TNote extends { columnIndex: number }>(
  row: readonly TNote[] | undefined,
  targetColumnIndex: number,
) {
  if (!row || row.length === 0) {
    return undefined;
  }

  return row.reduce((closestNote, candidateNote) =>
    Math.abs(candidateNote.columnIndex - targetColumnIndex) <
    Math.abs(closestNote.columnIndex - targetColumnIndex)
      ? candidateNote
      : closestNote,
  );
}
