import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muso Dojo",
  description: "Play Music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            display: "flex",
            gap: "1em",
            alignItems: "center",
            padding: "0.7em",
          }}
        >
          <Image
            src="/logo.png"
            alt="Muso Dojo Logo"
            width={80}
            height={80}
            style={{ borderRadius: "50%", width: "2em", height: "2em" }}
          />
          <h1
            style={{
              fontSize: "1.5em",
              fontWeight: "bold",
              margin: "0",
            }}
          >
            Muso Dojo
          </h1>
        </header>
        <main style={{ maxWidth: "50em", margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
