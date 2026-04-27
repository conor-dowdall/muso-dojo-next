"use client";

import Link from "next/link";
import Image from "next/image";
import { DoorOpen, Play, Pointer } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { MusicGroup } from "@/components/music-group/MusicGroup";
import { Button } from "@/components/ui/buttons/Button";
import { assetPath, assetUrl } from "@/utils/assets/assetPath";
import styles from "./page.module.css";

interface ThemeChoice<T extends FretboardThemeName> {
  id: T;
  title: string;
}

const fretboardThemeChoices: ThemeChoice<FretboardThemeName>[] = [
  { id: "maple", title: "Maple" },
  { id: "rosewood", title: "Rosewood" },
  { id: "ebony", title: "Ebony" },
  { id: "pauFerro", title: "Pau Ferro" },
];

export default function LandingPage() {
  const [fretboardTheme, setFretboardTheme] =
    useState<FretboardThemeName>("ebony");
  const [fretRange, setFretRange] = useState<[number, number]>([0, 7]);
  const fretboardThemeTitle =
    fretboardThemeChoices.find((theme) => theme.id === fretboardTheme)?.title ??
    "Ebony";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 48rem)");
    const syncFretRange = () =>
      setFretRange(mediaQuery.matches ? [0, 5] : [0, 7]);

    syncFretRange();
    mediaQuery.addEventListener("change", syncFretRange);

    return () => mediaQuery.removeEventListener("change", syncFretRange);
  }, []);

  return (
    <div
      className={styles.page}
      style={
        {
          "--video-title-card-image": assetUrl(
            "/logos/video-title-card-on-dark-transparent-1920x1080.webp",
          ),
        } as CSSProperties
      }
    >
      <section className={styles.landingSurface}>
        <main className={styles.previewShell}>
          <div className={styles.previewStack}>
            <header className={styles.appHeader}>
              <Image
                alt="Muso Dojo"
                className={styles.appHeaderLogo}
                height={180}
                src={assetPath(
                  "/logos/app-header-on-dark-transparent-560x180.webp",
                )}
                width={560}
              />
            </header>

            <section className={styles.actionGrid} aria-label="Start options">
              <button
                className={styles.videoIntro}
                type="button"
                aria-label="Play intro video"
              >
                <span className={styles.videoFrame}>
                  <span className={styles.videoImage} aria-hidden="true" />
                  <span className={styles.videoOverlay}>
                    <span className={styles.watchChip}>
                      <Play />
                      <span>Watch intro</span>
                    </span>
                  </span>
                  <span className={styles.videoTitleCard} aria-hidden="true" />
                </span>
                <span className={styles.videoControls}>
                  <span className={styles.videoPlayControl} aria-hidden="true">
                    <Play />
                  </span>
                  <span className={styles.videoProgress} aria-hidden="true" />
                  <span className={styles.videoLength}>0:00 / 1:20</span>
                </span>
              </button>

              <Link className={styles.actionCard} href="/dojo">
                <span className={styles.actionIcon}>
                  <DoorOpen />
                </span>
                <span className={styles.actionCopy}>
                  <span className={styles.actionTitle}>Begin</span>
                  <span className={styles.actionSubtitle}>Enter the Dojo</span>
                </span>
              </Link>
            </section>

            <section className={styles.previewPanel}>
              <div className={styles.instrumentIntro}>
                <span className={styles.instrumentTitleGroup}>
                  <span className={styles.instrumentTitle}>Guitar</span>
                  <span className={styles.playHint}>
                    <Pointer></Pointer>
                    <span>Interactive</span>
                  </span>
                </span>
                <span className={styles.instrumentDetails}>
                  {fretboardThemeTitle} finish · Standard tuning · E A D G B E
                </span>
              </div>

              <div className={styles.musicGroupFrame}>
                <MusicGroup
                  accentColor="#8fb7c9"
                  className={styles.landingMusicGroup}
                  headerClassName={styles.landingMusicGroupHeader}
                  initialNoteCollectionKey="major"
                  initialRootNote="C"
                >
                  <Fretboard
                    config={{ fretRange }}
                    initialDisplayFormatId="note-names"
                    layout={{
                      height: "var(--instrument-preview-height)",
                      maxHeight: "var(--instrument-preview-height)",
                      widthMode: "fill",
                    }}
                    showHeader={false}
                    theme={fretboardTheme}
                  />
                </MusicGroup>
              </div>

              <div className={styles.themeControls} aria-label="Wood">
                {fretboardThemeChoices.map((theme) => {
                  const selected = theme.id === fretboardTheme;

                  return (
                    <Button
                      className={styles.themeButton}
                      density="compact"
                      key={theme.id}
                      label={theme.title}
                      onClick={() => setFretboardTheme(theme.id)}
                      selected={selected}
                      size="md"
                      type="button"
                      variant="outline"
                    />
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </section>
    </div>
  );
}
