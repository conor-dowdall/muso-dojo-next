import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ArrangementChartEntryTile,
  ArrangementChartSourceNotice,
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

describe("Arrangement Chart source notice", () => {
  it("summarizes available updates without treating them as an error", () => {
    const markup = renderToStaticMarkup(
      <ArrangementChartSourceNotice
        unavailableCount={0}
        updateCount={2}
        onReview={() => undefined}
      />,
    );

    expect(markup).toContain("2 Section updates available");
    expect(markup).toContain("Chart is using its saved Arrangement content.");
    expect(markup).toContain("Review Arrangement source changes");
  });

  it("reassures the user when a Section cannot be updated", () => {
    const markup = renderToStaticMarkup(
      <ArrangementChartSourceNotice
        unavailableCount={1}
        updateCount={0}
        onReview={() => undefined}
      />,
    );

    expect(markup).toContain("1 Section cannot currently be updated");
    expect(markup).toContain("Saved Arrangement content will still play.");
  });

  it("renders nothing while every Section source is current", () => {
    expect(
      renderToStaticMarkup(
        <ArrangementChartSourceNotice
          unavailableCount={0}
          updateCount={0}
          onReview={() => undefined}
        />,
      ),
    ).toBe("");
  });
});
