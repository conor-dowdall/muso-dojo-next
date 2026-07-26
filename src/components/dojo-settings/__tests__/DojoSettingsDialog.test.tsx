import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";

describe("DojoSettingsDialog", () => {
  it("places backup controls in a separated section after appearance settings", () => {
    const markup = renderToStaticMarkup(
      <DojoSettingsDialog onClose={() => undefined} />,
    );
    const appearanceIndex = markup.indexOf('aria-label="Appearance settings"');
    const backupsIndex = markup.indexOf('aria-label="Backups"');

    expect(markup).toContain('data-layout="stack"');
    expect(appearanceIndex).toBeGreaterThanOrEqual(0);
    expect(backupsIndex).toBeGreaterThan(appearanceIndex);
    expect(markup).toContain("Save Dojo Backup");
    expect(markup).toContain("Save current Dojo as a JSON file");
    expect(markup).toContain("Load Dojo Backup");
    expect(markup).toContain("Replace current Dojo with a JSON backup");
    expect(markup).toContain('accept=".json,application/json"');
  });
});
