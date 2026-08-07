import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";
import { DojoStartFreshAction } from "@/components/dojo-settings/DojoBackupSettings";

describe("DojoSettingsDialog", () => {
  it("places backup controls in a separated section after appearance settings", () => {
    const markup = renderToStaticMarkup(
      <DojoSettingsDialog onClose={() => undefined} />,
    );
    const appearanceIndex = markup.indexOf('aria-label="Appearance settings"');
    const backupsIndex = markup.indexOf('aria-label="Data &amp; Backups"');

    expect(markup).toContain('data-layout="stack"');
    expect(appearanceIndex).toBeGreaterThanOrEqual(0);
    expect(backupsIndex).toBeGreaterThan(appearanceIndex);
    expect(markup).toContain("Data &amp; Backups");
    expect(markup).toContain(
      "Everything in your Dojo is saved automatically on this device.",
    );
    expect(markup).toContain("Download Dojo Backup");
    expect(markup).toContain(
      "Save a portable copy of your Sessions, Arrangements, personal library, and preferences.",
    );
    expect(markup).toContain("Restore Dojo Backup");
    expect(markup).toContain(
      "Replace everything in your Dojo with a backup file.",
    );
    expect(markup).toContain("Start Fresh");
    expect(markup).not.toContain("Start Fresh…");
    expect(markup).toContain(
      "Replace all Sessions and Arrangements with a new empty Session. Your Tunings, Progressions, and preferences will remain.",
    );
    expect(markup).not.toContain("Save the Set");
    expect(markup).not.toContain("Recall a Set");
    expect(markup).not.toContain("current Dojo");
    expect(markup).toContain('accept=".json,application/json"');
  });

  it("shows the complete Start Fresh impact in its confirmation", () => {
    const markup = renderToStaticMarkup(
      <DojoStartFreshAction
        counts={{
          arrangements: 1,
          progressions: 4,
          sessions: 2,
          tunings: 3,
        }}
        isConfirming
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onDownloadBackup={() => undefined}
        onRequestConfirm={() => undefined}
      />,
    );

    expect(markup).toContain(
      "Replace 2 Sessions and 1 Arrangement with one new empty Session. Your 3 Tunings, 4 Progressions, and preferences will remain.",
    );
    expect(markup).toContain("Cancel");
    expect(markup).toContain("Download Backup");
    expect(markup).toContain("Start Fresh");
    expect(markup).toContain('data-tone="danger"');
  });

  it("keeps the Start Fresh action neutral until confirmation", () => {
    const markup = renderToStaticMarkup(
      <DojoStartFreshAction
        counts={{
          arrangements: 1,
          progressions: 4,
          sessions: 2,
          tunings: 3,
        }}
        isConfirming={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onDownloadBackup={() => undefined}
        onRequestConfirm={() => undefined}
      />,
    );

    expect(markup).toContain('data-tone="neutral"');
    expect(markup).not.toContain('data-tone="danger"');
  });
});
