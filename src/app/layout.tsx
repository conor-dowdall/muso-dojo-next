import { SerwistProvider } from "@serwist/next/react";
import { type Metadata, type Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { type ReactNode } from "react";
import { AppThemeProvider } from "@/components/app-theme/AppThemeProvider";
import { getAppThemeInitScript } from "@/utils/app-theme/getAppThemeInitScript";

const inter = localFont({
  src: "../../public/fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
});

const appName = "Muso Dojo";
const appDescription = "Play Music";
const vercelUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

const metadataBase = new URL(
  vercelUrl
    ? vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`
    : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: appDescription,
  applicationName: appName,
  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: appName,
    description: appDescription,
    siteName: appName,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: appName,
    description: appDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#08090d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: getAppThemeInitScript() }} />
        <AppThemeProvider>
          <SerwistProvider swUrl="/sw.js" reloadOnOnline={false}>
            {children}
          </SerwistProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
