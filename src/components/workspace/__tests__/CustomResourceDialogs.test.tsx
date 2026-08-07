import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomTuningsDialog } from "@/components/fretboard-tuning/CustomTuningsDialog";
import { CustomChordProgressionsDialog } from "@/components/music-theory/CustomChordProgressionsDialog";

describe("custom resource dialog modes", () => {
  it("uses contextual selections in choose mode", () => {
    const tuningMarkup = renderToStaticMarkup(
      <CustomTuningsDialog
        instrument="guitar"
        isOpen
        mode="choose"
        seedOpenMidiNotes={[40, 45, 50, 55, 59, 64]}
        onClose={() => undefined}
        onSelect={() => undefined}
      />,
    );
    const progressionMarkup = renderToStaticMarkup(
      <CustomChordProgressionsDialog
        isOpen
        mode="choose"
        onClose={() => undefined}
        onDeleteSelected={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expect(tuningMarkup).toContain('aria-label="Custom tuning choices"');
    expect(tuningMarkup).toContain("Using Guitar as Template");
    expect(tuningMarkup).toContain(
      'aria-label="Create a custom tuning using the Guitar instrument template"',
    );
    expect(tuningMarkup).not.toContain(
      'aria-label="Choose instrument template.',
    );
    expect(progressionMarkup).toContain(
      'aria-label="Custom progression choices"',
    );
  });

  it("opens resources for management without applying them", () => {
    const tuningMarkup = renderToStaticMarkup(
      <CustomTuningsDialog isOpen mode="manage" onClose={() => undefined} />,
    );
    const progressionMarkup = renderToStaticMarkup(
      <CustomChordProgressionsDialog
        isOpen
        mode="manage"
        onClose={() => undefined}
      />,
    );

    expect(tuningMarkup).toContain('aria-label="Manage custom tunings"');
    expect(tuningMarkup).toContain("Instrument Template");
    expect(tuningMarkup).toContain(
      'aria-label="Choose instrument template. Current: Guitar"',
    );
    expect(progressionMarkup).toContain(
      'aria-label="Manage custom progressions"',
    );
  });
});
