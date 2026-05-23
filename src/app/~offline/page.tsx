import Image from "next/image";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import styles from "./page.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <header className={styles.appHeader}>
          <Image
            alt="Muso Dojo"
            className={styles.appHeaderLogo}
            height={450}
            preload
            src="/logos/hero-lockup-on-dark-transparent-1600x450.webp"
            width={1600}
          />
        </header>

        <Link
          className={styles.actionCard}
          href="/dojo"
          aria-label="Begin. Enter the saved Dojo while offline."
        >
          <span className={styles.actionIcon}>
            <WifiOff />
          </span>
          <span className={styles.actionCopy}>
            <span className={styles.actionStatus}>Offline Mode</span>
            <span className={styles.actionTitle}>Begin</span>
            <span className={styles.actionSubtitle}>Enter the Saved Dojo</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
