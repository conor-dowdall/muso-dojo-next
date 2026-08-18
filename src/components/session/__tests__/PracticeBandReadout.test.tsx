import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PracticeBandReadout } from "@/components/session/PracticeBandTransport";

const readout = {
  barAccessibleLabel: "2",
  barNumberLabel: "02",
  barTotalAccessibleLabel: "8",
  barTotalLabel: "08",
  countLabel: "8 Bars",
  identityAccessibleLabel: "C major",
  identityLabel: "C",
  positionLabel: "Bar" as const,
};

describe("PracticeBandReadout", () => {
  it("can reserve musical identity for the nearby Chart context", () => {
    const markup = renderToStaticMarkup(
      <PracticeBandReadout
        prominence="title"
        readout={readout}
        showIdentity={false}
      />,
    );

    expect(markup).toContain('aria-label="Bar 2 of 8. C major."');
    expect(markup).toContain('data-identity="hidden"');
    expect(markup).not.toContain(">C</span>");
  });

  it("shows musical identity by default in other Session views", () => {
    const markup = renderToStaticMarkup(
      <PracticeBandReadout prominence="title" readout={readout} />,
    );

    expect(markup).toContain('data-identity="visible"');
    expect(markup).toContain(">C</span>");
  });
});
