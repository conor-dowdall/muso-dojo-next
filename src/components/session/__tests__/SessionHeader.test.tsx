import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SessionHeader } from "@/components/session/SessionHeader";

describe("SessionHeader", () => {
  it("names the Session overflow control explicitly", () => {
    const markup = renderToStaticMarkup(
      <SessionHeader
        viewMode="session"
        workspaceViewMode="session"
        onOpenAddDialog={() => undefined}
        onOpenSessionsDialog={() => undefined}
        onOpenSessionTempo={() => undefined}
        onViewModeChange={() => undefined}
      />,
    );

    expect(markup).toContain('aria-label="Session menu"');
    expect(markup).not.toContain('aria-label="Menu"');
  });
});
