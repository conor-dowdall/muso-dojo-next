"use client";

import { Gauge } from "lucide-react";
import {
  DialogCloseFooter,
  DialogContent,
  DialogContentSection,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { SessionTempoEditor } from "@/components/session/SessionTempoEditor";
import { useAppStore } from "@/stores/appStore";

export function ArrangementTempoDialog({
  arrangementId,
  onClose,
}: {
  arrangementId: string;
  onClose: () => void;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const setTempo = useAppStore((state) => state.setArrangementTempoBpm);
  if (!arrangement) return null;
  return (
    <>
      <DialogHeader
        icon={<Gauge />}
        title="Arrangement Tempo"
        onClose={onClose}
      />
      <DialogContent layout="stack">
        <DialogContentSection ariaLabel="Arrangement tempo">
          <SessionTempoEditor
            label={`Tempo (BPM) for ${arrangement.name}`}
            tempoBpm={arrangement.tempoBpm}
            onTempoBpmChange={(tempo) => setTempo(arrangementId, tempo)}
          />
        </DialogContentSection>
      </DialogContent>
      <DialogCloseFooter onClose={onClose} />
    </>
  );
}
