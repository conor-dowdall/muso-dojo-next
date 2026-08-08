import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DojoResourceImportDialog } from "@/components/workspace/DojoResourceImportDialog";
import { type DojoResourceImportCatalog } from "@/utils/dojo-backup/dojoResourceImport";

const catalog: DojoResourceImportCatalog = {
  progressions: [
    {
      collision: false,
      key: "progression:turnaround",
      kind: "progression",
      name: "Turnaround",
      resource: {
        id: "turnaround",
        name: "Turnaround",
        progression: {
          chords: [
            {
              chordCollectionKey: "dominant7",
              degree: "1",
              durationInBars: 1,
            },
          ],
        },
      },
      subtitle: "I7",
    },
  ],
  tunings: [
    {
      collision: true,
      keepBothName: "Open D Copy",
      key: "tuning:open-d",
      kind: "tuning",
      name: "Open D",
      resource: {
        id: "open-d",
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
      subtitle: "Guitar • D A D F♯ A D",
    },
  ],
};

describe("DojoResourceImportDialog", () => {
  it("shows selectable backup resources and explicit safe collision handling", () => {
    const markup = renderToStaticMarkup(
      <DojoResourceImportDialog
        catalog={catalog}
        exportedAt="2026-08-07T10:30:00.000Z"
        isOpen
        onClose={() => undefined}
        onImport={() => undefined}
      />,
    );

    expect(markup).toContain("Import Resources");
    expect(markup).toContain(
      "Resources without name conflicts are included automatically. Review any conflicts before importing.",
    );
    expect(markup).toContain("Custom Tunings");
    expect(markup).toContain("Custom Chord Progressions");
    expect(markup).toContain(
      'aria-label="Include backup Open D tuning as Open D Copy"',
    );
    expect(markup).toContain('aria-label="Skip Turnaround progression"');
    expect(markup).toContain("Open D Copy");
    expect(markup).toContain(
      "A resource with this name is already in your Dojo. If included, the backup version will be imported as “Open D Copy”.",
    );
    expect(markup).toContain("Skip");
    expect(markup).toContain("INCLUDED");
    expect(markup).not.toContain("KEEP BOTH");
    expect(markup).not.toContain('type="checkbox"');
    expect(markup).toContain("Import 1 Resource");
    expect(markup).not.toContain("Sessions");
    expect(markup).not.toContain("Arrangements");
  });

  it("explains when a valid backup has no importable resources", () => {
    const markup = renderToStaticMarkup(
      <DojoResourceImportDialog
        catalog={{ progressions: [], tunings: [] }}
        exportedAt="2026-08-07T10:30:00.000Z"
        isOpen
        onClose={() => undefined}
        onImport={() => undefined}
      />,
    );

    expect(markup).toContain(
      "This backup contains no Custom Tunings or Custom Chord Progressions.",
    );
  });
});
