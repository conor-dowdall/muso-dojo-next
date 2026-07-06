import { getNoteCollectionPitchClasses as getUpstreamNoteCollectionPitchClasses } from "@musodojo/music-theory-data";

export function getNoteCollectionPitchClasses(
  params: Parameters<typeof getUpstreamNoteCollectionPitchClasses>[0],
) {
  return getUpstreamNoteCollectionPitchClasses(params) as
    ReadonlySet<number> | undefined;
}
