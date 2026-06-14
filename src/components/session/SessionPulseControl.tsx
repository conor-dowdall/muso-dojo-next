"use client";

import { useState } from "react";
import { Square } from "lucide-react";
import { musoAudioEngine } from "@/audio";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useAppStore } from "@/stores/appStore";
import { SessionTempoDialog } from "./SessionTempoDialog";

export function SessionPulseControl({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const session = useAppStore((state) => state.sessions[sessionId]);
  const setSessionTempoBpm = useAppStore((state) => state.setSessionTempoBpm);

  if (!session) return null;

  const tempoBpm = session.tempoBpm ?? 80;

  return (
    <>
      <Button
        aria-label={`Session tempo settings. Current: ${tempoBpm} BPM`}
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

      <SessionTempoDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onTempoBpmChange={(value) => setSessionTempoBpm(sessionId, value)}
        tempoBpm={tempoBpm}
      />
    </>
  );
}
