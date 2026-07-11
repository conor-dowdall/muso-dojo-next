import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";
import {
  type AutomaticRhythmConfig,
  type PartBandConfig,
  type PartBandRole,
  type PartBandSourceConfig,
} from "@/types/session";

export interface PartBandModuleOption {
  detail?: string;
  id: string;
  label: string;
}

export interface MusicPartSettings {
  automaticLengthBeats?: number;
  effectiveLengthBeats?: number;
  band?: PartBandConfig;
  automaticRhythm?: AutomaticRhythmConfig;
  bandModuleOptions?: Record<PartBandRole, PartBandModuleOption[]>;
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  showHeader?: boolean;
}

export interface MusicPartControlProps extends MusicPartSettings {
  onBandSourceChange?: (
    role: PartBandRole,
    source: PartBandSourceConfig,
  ) => void;
  initialRootNote?: string;
  onRootNoteChange?: SettingSetter<string>;
  initialNoteCollectionKey?: NoteCollectionKey;
  onNoteCollectionKeyChange?: SettingSetter<NoteCollectionKey>;
}
