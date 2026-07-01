"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import fieldStyles from "@/components/ui/control-field/ControlField.module.css";
import { RangeSlider } from "@/components/ui/range-slider/RangeSlider";
import styles from "./SessionTempoEditor.module.css";

const MIN_TEMPO = 30;
const MAX_TEMPO = 300;
const SLIDER_COMMIT_DELAY_MS = 250;
const lowerTempoAdjustments = [-5, -1] as const;
const higherTempoAdjustments = [1, 5] as const;

function clampTempo(value: number) {
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(value)));
}

function parseTempoDraft(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  const parsedTempo = Number(trimmedValue);

  return Number.isFinite(parsedTempo) ? clampTempo(parsedTempo) : null;
}

export function SessionTempoEditor({
  label = "Tempo (BPM)",
  onTempoBpmChange,
  tempoBpm,
}: {
  label?: string;
  onTempoBpmChange: (tempoBpm: number) => void;
  tempoBpm: number;
}) {
  const [draftTempo, setDraftTempo] = useState<string | null>(null);
  const [sliderDraftTempo, setSliderDraftTempo] = useState<number | null>(null);
  const sliderCommitTimerRef = useRef<number | null>(null);
  const displayedTempo = draftTempo ?? String(tempoBpm);
  const sliderTempo = sliderDraftTempo ?? tempoBpm;

  useEffect(() => {
    return () => {
      if (sliderCommitTimerRef.current !== null) {
        window.clearTimeout(sliderCommitTimerRef.current);
      }
    };
  }, []);

  const clearSliderCommitTimer = () => {
    if (sliderCommitTimerRef.current === null) {
      return;
    }

    window.clearTimeout(sliderCommitTimerRef.current);
    sliderCommitTimerRef.current = null;
  };

  const commitTempo = (nextTempo: number) => {
    const clampedTempo = clampTempo(nextTempo);

    if (clampedTempo !== tempoBpm) {
      onTempoBpmChange(clampedTempo);
    }
  };

  const commitSliderTempo = (nextTempo = sliderDraftTempo) => {
    clearSliderCommitTimer();

    if (nextTempo === null) {
      return;
    }

    setSliderDraftTempo(null);
    commitTempo(nextTempo);
  };

  const scheduleSliderTempoCommit = (nextTempo: number) => {
    clearSliderCommitTimer();

    sliderCommitTimerRef.current = window.setTimeout(() => {
      sliderCommitTimerRef.current = null;
      commitSliderTempo(nextTempo);
    }, SLIDER_COMMIT_DELAY_MS);
  };

  const commitDraftTempo = () => {
    const nextTempo = parseTempoDraft(displayedTempo);

    if (nextTempo === null) {
      setDraftTempo(null);
      return;
    }

    setDraftTempo(null);
    commitTempo(nextTempo);
  };

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    commitDraftTempo();
    event.currentTarget.blur();
  };

  const renderAdjustmentButton = (adjustment: number) => {
    const nextTempo = clampTempo(tempoBpm + adjustment);
    const adjustmentLabel = `${adjustment > 0 ? "+" : ""}${adjustment}`;

    return (
      <IconButton
        key={adjustment}
        aria-label={`${adjustment > 0 ? "Increase" : "Decrease"} tempo by ${Math.abs(adjustment)} bpm`}
        className={`${fieldStyles.adjustmentButton} ${styles.adjustmentButton}`}
        disabled={nextTempo === tempoBpm}
        icon={
          <span aria-hidden="true" className={fieldStyles.adjustmentText}>
            {adjustmentLabel}
          </span>
        }
        size="lg"
        shouldYield={false}
        onClick={() => {
          setDraftTempo(null);
          onTempoBpmChange(nextTempo);
        }}
      />
    );
  };

  return (
    <div className={styles.editor}>
      <RangeSlider
        label={label}
        max={MAX_TEMPO}
        min={MIN_TEMPO}
        step={1}
        value={sliderTempo}
        valueLabel={`${sliderTempo} bpm`}
        valueText={`${sliderTempo} bpm`}
        onBlur={() => commitSliderTempo()}
        onChange={(event) => {
          const nextTempo = clampTempo(event.currentTarget.valueAsNumber);

          setSliderDraftTempo(nextTempo);
          scheduleSliderTempoCommit(nextTempo);
        }}
        onKeyUp={() => commitSliderTempo()}
        onPointerUp={() => commitSliderTempo()}
      />

      <div className={styles.exactEditor}>
        {lowerTempoAdjustments.map(renderAdjustmentButton)}

        <label className={styles.numberField}>
          <span className={`${fieldStyles.surface} ${styles.numberControl}`}>
            <input
              aria-label="Exact session tempo in beats per minute"
              className={`${fieldStyles.text} ${fieldStyles.numericText} ${styles.numberInput}`}
              enterKeyHint="done"
              inputMode="numeric"
              max={MAX_TEMPO}
              min={MIN_TEMPO}
              step={1}
              type="number"
              value={displayedTempo}
              onBlur={commitDraftTempo}
              onChange={(event) => {
                const nextDraft = event.currentTarget.value;
                const nextTempo = Number(nextDraft);

                setDraftTempo(nextDraft);

                if (
                  nextDraft !== "" &&
                  Number.isInteger(nextTempo) &&
                  nextTempo >= MIN_TEMPO &&
                  nextTempo <= MAX_TEMPO
                ) {
                  onTempoBpmChange(nextTempo);
                }
              }}
              onKeyDown={handleNumberInputKeyDown}
            />
            <span className={fieldStyles.unit} aria-hidden="true">
              bpm
            </span>
          </span>
        </label>

        {higherTempoAdjustments.map(renderAdjustmentButton)}
      </div>
    </div>
  );
}
