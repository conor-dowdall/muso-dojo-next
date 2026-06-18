"use client";

import { useLayoutEffect, useRef, useState, type SyntheticEvent } from "react";
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
  label = "Session tempo",
  onSubmit,
  onTempoBpmChange,
  shouldFocusInput = false,
  tempoBpm,
}: {
  label?: string;
  onSubmit?: () => void;
  onTempoBpmChange: (tempoBpm: number) => void;
  shouldFocusInput?: boolean;
  tempoBpm: number;
}) {
  const numberInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedInitialInput = useRef(false);
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

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    commitDraftTempo();
    onSubmit?.();
  };

  useLayoutEffect(() => {
    if (!shouldFocusInput) {
      hasFocusedInitialInput.current = false;
      return;
    }

    if (hasFocusedInitialInput.current) {
      return;
    }

    let frameId: number | undefined;
    let timeoutId: number | undefined;
    let attempts = 0;

    const focusInput = () => {
      const input = numberInputRef.current;
      const dialog = input?.closest("dialog");

      if (!input || input.closest("[inert]") || (dialog && !dialog.open)) {
        return false;
      }

      input.scrollIntoView({ block: "nearest", inline: "nearest" });
      input.focus({ preventScroll: true });

      try {
        input.select();
      } catch {
        // Some mobile number inputs do not expose text selection.
      }

      return document.activeElement === input;
    };

    const tryFocusInput = () => {
      attempts += 1;

      if (focusInput()) {
        hasFocusedInitialInput.current = true;
        return;
      }

      if (attempts < 5) {
        timeoutId = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(tryFocusInput);
        }, 40);
      }
    };

    frameId = window.requestAnimationFrame(tryFocusInput);

    return () => {
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [shouldFocusInput]);

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

      <form className={styles.exactEditor} onSubmit={handleSubmit}>
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
              ref={numberInputRef}
              step={1}
              type="number"
              value={displayedTempo}
              onBlur={(event) => {
                if (
                  !event.currentTarget.form?.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  commitDraftTempo();
                }
              }}
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
            />
            <span className={styles.unit} aria-hidden="true">
              bpm
            </span>
          </span>
        </label>

        {higherTempoAdjustments.map(renderAdjustmentButton)}
      </form>
    </div>
  );
}
