import {
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { type InstrumentType, type PartModuleType } from "@/types/session";

export const DEFAULT_INSTRUMENT_TYPE = "fretboard" satisfies InstrumentType;
export const DEFAULT_PART_MODULE_TYPE = "instrument" satisfies PartModuleType;
export const DEFAULT_PART_ROOT_NOTE = "C" satisfies RootNote;
export const DEFAULT_PART_NOTE_COLLECTION_KEY =
  "major" satisfies NoteCollectionKey;
export const DEFAULT_SESSION_COUNT_IN_BEATS = 0;
export const DEFAULT_SESSION_NAME = "My Session";
export const FALLBACK_SESSION_ID = "session-1";
export const FALLBACK_LAST_MODIFIED = "1970-01-01T00:00:00.000Z";
