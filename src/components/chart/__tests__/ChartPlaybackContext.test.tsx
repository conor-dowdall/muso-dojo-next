import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChartPlaybackContext } from "@/components/chart/ChartPlaybackContext";

describe("ChartPlaybackContext", () => {
  it("can show musical identity while retaining the precise Part target accessibly", () => {
    const markup = renderToStaticMarkup(
      <ChartPlaybackContext
        accessibleTarget="Part 01, C major"
        actionLabel="Part Playback"
        label="C"
        showPlaybackIcon={false}
        onOpenPlayback={() => undefined}
      />,
    );

    expect(markup).toContain(
      'aria-label="Chart playback target: Part 01, C major"',
    );
    expect(markup).toContain(
      'aria-label="Playback options for Part 01, C major"',
    );
    expect(markup).toContain(">C</span>");
    expect(markup).toContain(">Part Playback</span>");
    expect(markup).not.toContain(">Part 01</span>");
    expect(markup).not.toContain("<svg");
  });
});
