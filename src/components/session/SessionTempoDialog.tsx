"use client";

import { Gauge } from "lucide-react";
import {
  DialogContent,
  DialogContentSection,
  DialogCloseFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { useAppStore } from "@/stores/appStore";
import { SessionTempoEditor } from "./SessionTempoEditor";

export function SessionTempoDialog({
  onClose,
  sessionId,
}: {
  onClose: () => void;
  sessionId: string;
}) {
  const sessionName = useAppStore(
    (state) => state.sessions[sessionId]?.name ?? "Session",
  );
  const tempoBpm = useAppStore(
    (state) => state.sessions[sessionId]?.tempoBpm ?? 80,
  );
  const setSessionTempoBpm = useAppStore((state) => state.setSessionTempoBpm);

  return (
    <>
      <DialogHeader icon={<Gauge />} title="Session Tempo" onClose={onClose} />
      <DialogContent layout="stack">
        <DialogContentSection ariaLabel="Session tempo">
          <SessionTempoEditor
            label={`Tempo (BPM) for ${sessionName}`}
            tempoBpm={tempoBpm}
            onTempoBpmChange={(nextTempoBpm) =>
              setSessionTempoBpm(sessionId, nextTempoBpm)
            }
          />
        </DialogContentSection>
      </DialogContent>
      <DialogCloseFooter onClose={onClose} />
    </>
  );
}
