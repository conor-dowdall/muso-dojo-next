"use client";

import { useState } from "react";
import { Square } from "lucide-react";
import { musoAudioEngine } from "@/audio";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import {
  DisclosureList,
  DisclosureListChoice,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  Dialog,
  DialogContent,
  DialogContentSection,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  RangeSlider,
  RangeSliderGroup,
} from "@/components/ui/range-slider/RangeSlider";
import { useAppStore } from "@/stores/appStore";

export function SessionPulseControl({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const session = useAppStore((state) => state.sessions[sessionId]);
  const setSessionCountInBeats = useAppStore(
    (state) => state.setSessionCountInBeats,
  );
  const setSessionMetronomeEnabled = useAppStore(
    (state) => state.setSessionMetronomeEnabled,
  );
  const setSessionTempoBpm = useAppStore((state) => state.setSessionTempoBpm);

  if (!session) return null;

  const tempoBpm = session.tempoBpm ?? 80;
  const countInBeats = session.countInBeats ?? 4;
  const metronomeEnabled = session.metronomeEnabled ?? true;

  return (
    <>
      <Button
        aria-label={`Tempo settings. Current: ${tempoBpm} BPM`}
        label={`${tempoBpm} BPM`}
        size="sm"
        onClick={() => setIsOpen(true)}
      />
      <IconButton
        aria-label="Stop all audio"
        icon={<Square />}
        size="sm"
        shouldYield={false}
        tooltip="Stop all"
        onPointerDown={(event) => {
          if (event.isPrimary && event.button === 0) {
            musoAudioEngine.stopAll();
          }
        }}
        onClick={(event) => {
          if (event.detail === 0) {
            musoAudioEngine.stopAll();
          }
        }}
      />

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} size="standard">
        <DialogHeader
          title="Tempo and Count-in"
          onClose={() => setIsOpen(false)}
        />
        <DialogContent layout="stack" menuRhythm="standard">
          <DialogContentSection ariaLabel="Timing">
            <RangeSliderGroup>
              <RangeSlider
                label="Tempo"
                max={300}
                min={30}
                value={tempoBpm}
                valueLabel={`${tempoBpm} BPM`}
                onChange={(event) =>
                  setSessionTempoBpm(
                    sessionId,
                    event.currentTarget.valueAsNumber,
                  )
                }
              />
              <RangeSlider
                label="Count-in beats"
                max={8}
                min={0}
                value={countInBeats}
                valueLabel={
                  countInBeats === 0
                    ? "No count-in"
                    : `${countInBeats} count-in beats`
                }
                onChange={(event) =>
                  setSessionCountInBeats(
                    sessionId,
                    event.currentTarget.valueAsNumber,
                  )
                }
              />
            </RangeSliderGroup>
          </DialogContentSection>
          <DialogContentSection ariaLabel="Metronome">
            <DisclosureList>
              <DisclosureListChoice
                label="Metronome On"
                selected={metronomeEnabled}
                onClick={() => setSessionMetronomeEnabled(sessionId, true)}
              />
              <DisclosureListChoice
                label="Metronome Off"
                selected={!metronomeEnabled}
                onClick={() => setSessionMetronomeEnabled(sessionId, false)}
              />
            </DisclosureList>
          </DialogContentSection>
        </DialogContent>
      </Dialog>
    </>
  );
}
