import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArrangementChartEntryTile } from "@/components/arrangement/ArrangementWorkspace";

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
});
