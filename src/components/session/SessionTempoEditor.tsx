"use client";

import { useState, type KeyboardEvent } from "react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { RangeSlider } from "@/components/ui/range-slider/RangeSlider";
import styles from "./SessionTempoEditor.module.css";

const MIN_TEMPO = 30;
const MAX_TEMPO = 300;
const lowerTempoAdjustments = [-5, -1] as const;
const higherTempoAdjustments = [1, 5] as const;

function clampTempo(value: number) {
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(value)));
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
  const displayedTempo = draftTempo ?? String(tempoBpm);

  const commitDraftTempo = () => {
    const parsedTempo = Number(displayedTempo);

    if (!Number.isFinite(parsedTempo)) {
      setDraftTempo(null);
      return;
    }

    const nextTempo = clampTempo(parsedTempo);
    setDraftTempo(null);
    onTempoBpmChange(nextTempo);
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
        className={styles.adjustmentButton}
        disabled={nextTempo === tempoBpm}
        icon={
          <span aria-hidden="true" className={styles.adjustmentLabel}>
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
        value={tempoBpm}
        valueLabel={`${tempoBpm} bpm`}
        valueText={`${tempoBpm} bpm`}
        onChange={(event) =>
          onTempoBpmChange(event.currentTarget.valueAsNumber)
        }
      />

      <div className={styles.exactEditor}>
        {lowerTempoAdjustments.map(renderAdjustmentButton)}

        <label className={styles.numberField}>
          <span className={styles.numberControl}>
            <input
              aria-label="Exact session tempo in beats per minute"
              className={styles.numberInput}
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
            <span className={styles.unit} aria-hidden="true">
              bpm
            </span>
          </span>
        </label>

        {higherTempoAdjustments.map(renderAdjustmentButton)}
      </div>
    </div>
  );
}
