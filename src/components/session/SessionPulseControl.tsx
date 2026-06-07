"use client";

import { useState } from "react";
import { Square } from "lucide-react";
import { musoAudioEngine } from "@/audio";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
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
  const setSessionTempoBpm = useAppStore((state) => state.setSessionTempoBpm);

  if (!session) return null;

  const tempoBpm = session.tempoBpm ?? 80;

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
        <DialogHeader title="Tempo" onClose={() => setIsOpen(false)} />
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
            </RangeSliderGroup>
          </DialogContentSection>
        </DialogContent>
      </Dialog>
    </>
  );
}
