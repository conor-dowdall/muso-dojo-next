import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ArrangementChartEntryTile,
  formatArrangementChartPlaybackLabel,
} from "@/components/arrangement/ArrangementWorkspace";

function renderTile({
  current = false,
  upcoming = false,
}: {
  current?: boolean;
  upcoming?: boolean;
} = {}) {
  return renderToStaticMarkup(
    <ArrangementChartEntryTile
      current={current}
      entryIndex={1}
      playbackActive
      playCount={2}
      selected={false}
      unavailable={false}
      upcoming={upcoming}
      onSelect={() => undefined}
    />,
  );
}

describe("Arrangement playback presentation", () => {
  it("reserves the active state and aria-current for the sounding Section", () => {
    const markup = renderTile({ current: true });

    expect(markup).toContain('aria-current="step"');
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain("currently playing");
    expect(markup).not.toContain("data-upcoming");
  });

  it("presents an upcoming chart without marking its Section current", () => {
    const markup = renderTile({ upcoming: true });

    expect(markup).toContain('data-upcoming="true"');
    expect(markup).toContain("up next chart displayed");
    expect(markup).not.toContain("data-active");
    expect(markup).not.toContain("aria-current");
  });

  it("adds finite multi-play progress to the active Section label", () => {
    expect(
      formatArrangementChartPlaybackLabel({
        entryIndex: 0,
        isActive: true,
        isEnding: false,
        playCount: 3,
        playIndex: 1,
      }),
    ).toBe("Section 01 • Play 2 of 3");
    expect(
      formatArrangementChartPlaybackLabel({
        entryIndex: 0,
        isActive: true,
        isEnding: false,
        playCount: 1,
        playIndex: 0,
      }),
    ).toBe("Section 01");
    expect(
      formatArrangementChartPlaybackLabel({
        entryIndex: 0,
        isActive: false,
        isEnding: false,
        playCount: 3,
        playIndex: 1,
      }),
    ).toBe("Section 01");
    expect(
      formatArrangementChartPlaybackLabel({
        entryIndex: 0,
        isActive: true,
        isEnding: true,
        playCount: 3,
        playIndex: 2,
      }),
    ).toBe("Section 01");
  });
});
