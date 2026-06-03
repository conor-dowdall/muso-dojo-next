"use client";

import { type CSSProperties, useCallback, useState } from "react";
import { AudioWaveform, Minus, Play, Plus, Square } from "lucide-react";
import { musoAudioEngine, type AudioPresetId, type DroneHandle } from "@/audio";
import { InstrumentNote } from "@/components/instrument/InstrumentNote";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { useManualPlayback } from "@/hooks/audio/useManualPlayback";
import { type SettingSetter } from "@/types/state";
import {
  DRONE_OCTAVE_MAX,
  DRONE_OCTAVE_MIN,
} from "@/utils/drone/droneDefaults";
import { resolveDronePitch } from "@/utils/drone/dronePitch";
import { resolveDroneAudioPresetId } from "@/utils/drone/resolveDroneAudioPreset";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import { DroneOptionsDialog } from "./DroneOptionsDialog";
import styles from "./DroneModule.module.css";

interface DroneModuleProps {
  audioPresetId?: AudioPresetId;
  octave?: number;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onClone?: () => void;
  onOctaveChange?: SettingSetter<number>;
  onRemove?: () => void;
  rootNote?: string;
  showHeader?: boolean;
}

export function DroneModule({
  audioPresetId,
  octave,
  onAudioPresetIdChange,
  onClone,
  onOctaveChange,
  onRemove,
  rootNote,
  showHeader = true,
}: DroneModuleProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const noteColors = useNoteColors();
  const pitch = resolveDronePitch({ rootNote, octave });
  const resolvedAudioPresetId = resolveDroneAudioPresetId(audioPresetId);
  const noteColor = resolveInstrumentNoteColor({
    midi: pitch.midi,
    mode: noteColors.mode,
    rootNote: pitch.rootNote,
  });
  const playbackRequestKey = `${pitch.midi}:${resolvedAudioPresetId}`;
  const startDrone = useCallback(
    () =>
      musoAudioEngine.startDrone({
        midiNotes: [pitch.midi],
        presetId: resolvedAudioPresetId,
        use: "drone",
        velocity: 0.78,
      }),
    [pitch.midi, resolvedAudioPresetId],
  );
  const stopDrone = useCallback(
    (handle: DroneHandle) => musoAudioEngine.stopDrone(handle),
    [],
  );
  const playback = useManualPlayback({
    restartKey: playbackRequestKey,
    start: startDrone,
    stop: stopDrone,
  });
  const isDroneActive = playback.isActive;
  const canLowerOctave = pitch.octave > DRONE_OCTAVE_MIN;
  const canRaiseOctave = pitch.octave < DRONE_OCTAVE_MAX;
  const playLabel = isDroneActive ? "Stop Drone" : "Play Drone";

  const lowerOctave = () => {
    onOctaveChange?.((currentOctave) => currentOctave - 1);
  };

  const raiseOctave = () => {
    onOctaveChange?.((currentOctave) => currentOctave + 1);
  };

  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.droneBody}
        className={styles.droneFrame}
        headerActions={
          <OverflowMenuButton
            aria-label="Drone options"
            onClick={() => setIsOptionsOpen(true)}
          />
        }
        headerPrimary={
          <span className={styles.droneIdentity}>
            <AudioWaveform />
            <span>Drone</span>
          </span>
        }
        showHeader={showHeader}
        style={
          {
            "--drone-note-color": noteColor.value,
          } as CSSProperties
        }
        widthMode="fill"
      >
        <div className={styles.droneSurface} data-active={isDroneActive}>
          <div className={styles.pitchPanel}>
            <span className={styles.noteSwatch}>
              <InstrumentNote
                note={{ midi: pitch.midi, emphasis: "large" }}
                label={pitch.label}
                noteColor={noteColor}
              />
            </span>
            <span className={styles.pitchText}>
              <span className={styles.pitchLabel}>{pitch.label}</span>
              <span className={styles.pitchCaption}>Root Tone</span>
            </span>
          </div>

          <Button
            aria-label={
              isDroneActive
                ? `Stop ${pitch.label} drone`
                : `Play ${pitch.label} drone`
            }
            className={styles.playButton}
            icon={isDroneActive ? <Square /> : <Play />}
            label={playLabel}
            layout="media"
            onClick={playback.toggle}
            selected={isDroneActive}
            size="xl"
            subtitle={pitch.label}
            variant={isDroneActive ? "filled" : "outline"}
          />

          <div
            className={styles.octaveStepper}
            role="group"
            aria-label={`Drone octave. Current: ${pitch.octave}`}
          >
            <IconButton
              aria-label="Lower drone octave"
              disabled={!onOctaveChange || !canLowerOctave}
              icon={<Minus />}
              onClick={lowerOctave}
              size="sm"
            />
            <span className={styles.octaveReadout}>
              <span className={styles.octaveValue}>{pitch.octave}</span>
              <span className={styles.octaveLabel}>Octave</span>
            </span>
            <IconButton
              aria-label="Raise drone octave"
              disabled={!onOctaveChange || !canRaiseOctave}
              icon={<Plus />}
              onClick={raiseOctave}
              size="sm"
            />
          </div>
        </div>
      </PartModuleFrame>

      {showHeader ? (
        <DroneOptionsDialog
          audioPresetId={audioPresetId}
          isOpen={isOptionsOpen}
          onAudioPresetIdChange={onAudioPresetIdChange}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onRemove={onRemove}
        />
      ) : null}
    </>
  );
}
