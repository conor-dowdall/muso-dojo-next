import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";
import {
  type AutomaticRhythmStyle,
  type PartBandConfig,
  type PartBandRole,
  type PartBandSourceConfig,
  type PartLengthMode,
} from "@/types/session";

export interface PartBandModuleOption {
  detail?: string;
  id: string;
  label: string;
}

export interface MusicPartSettings {
  lengthBeats?: number;
  effectiveLengthBeats?: number;
  lengthMode?: PartLengthMode;
  band?: PartBandConfig;
  automaticRhythm?: AutomaticRhythmStyle;
  bandModuleOptions?: Record<PartBandRole, PartBandModuleOption[]>;
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  showHeader?: boolean;
}

export interface MusicPartControlProps extends MusicPartSettings {
  initialLengthBeats?: number;
  onLengthBeatsChange?: SettingSetter<number>;
  onLengthModeChange?: (value: PartLengthMode) => void;
  onBandSourceChange?: (
    role: PartBandRole,
    source: PartBandSourceConfig,
  ) => void;
  initialRootNote?: string;
  onRootNoteChange?: SettingSetter<string>;
  initialNoteCollectionKey?: NoteCollectionKey;
  onNoteCollectionKeyChange?: SettingSetter<NoteCollectionKey>;
}
