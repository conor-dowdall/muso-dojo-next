import Link from "next/link";
import Image from "next/image";
import { DoorOpen } from "lucide-react";
import { assetPath } from "@/utils/assets/assetPath";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <header className={styles.appHeader}>
          <Image
            alt="Muso Dojo"
            className={styles.appHeaderLogo}
            height={450}
            preload
            src={assetPath(
              "/logos/hero-lockup-on-dark-transparent-1600x450.webp",
            )}
            width={1600}
          />
        </header>

        <Link className={styles.actionCard} href="/dojo">
          <span className={styles.actionIcon}>
            <DoorOpen />
          </span>
          <span className={styles.actionCopy}>
            <span className={styles.actionTitle}>Begin</span>
            <span className={styles.actionSubtitle}>Enter the Dojo</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
