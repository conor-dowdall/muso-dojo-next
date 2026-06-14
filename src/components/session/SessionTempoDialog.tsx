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

export function SessionTempoDialog({
  isOpen,
  onClose,
  onTempoBpmChange,
  tempoBpm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTempoBpmChange: (tempoBpm: number) => void;
  tempoBpm: number;
}) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="standard">
      <DialogHeader title="Session Tempo" onClose={onClose} />
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Timing">
          <RangeSliderGroup>
            <RangeSlider
              label="Session tempo"
              max={300}
              min={30}
              value={tempoBpm}
              valueLabel={`${tempoBpm} BPM`}
              onChange={(event) =>
                onTempoBpmChange(event.currentTarget.valueAsNumber)
              }
            />
          </RangeSliderGroup>
        </DialogContentSection>
      </DialogContent>
    </Dialog>
  );
}
