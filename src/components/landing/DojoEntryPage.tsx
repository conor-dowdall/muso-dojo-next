import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";
import styles from "./DojoEntryPage.module.css";

interface DojoEntryPageProps {
  actionAriaLabel: string;
  href: string;
  icon: ReactNode;
  status?: string;
  subtitle: string;
  title: string;
}

export function DojoEntryPage({
  actionAriaLabel,
  href,
  icon,
  status,
  subtitle,
  title,
}: DojoEntryPageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <header className={styles.appHeader}>
          <Image
            alt="Muso Dojo"
            className={styles.appHeaderLogo}
            height={450}
            preload
            src="/logos/hero-lockup-dark-transparent-1600x450.webp"
            width={1600}
          />
        </header>

        <Link
          className={styles.actionCard}
          href={href}
          aria-label={actionAriaLabel}
        >
          <span className={styles.actionIcon}>{icon}</span>
          <span className={styles.actionCopy}>
            {status ? (
              <span className={styles.actionStatus}>{status}</span>
            ) : null}
            <span className={styles.actionTitle}>{title}</span>
            <span className={styles.actionSubtitle}>{subtitle}</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
