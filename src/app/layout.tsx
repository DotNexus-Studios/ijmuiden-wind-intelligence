import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IJmuiden Wind Intelligence",
  description:
    "Real-time wind and water-sport decision dashboard for IJmuiden. RWS live measurements combined with HARMONIE, ECMWF, ICON-D2 and GFS forecasts.",
  applicationName: "IJmuiden Wind Intelligence",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IJmuiden Wind",
  },
  openGraph: {
    title: "IJmuiden Wind Intelligence",
    description: "Should you go kiting in IJmuiden today?",
    type: "website",
    locale: "nl_NL",
  },
};

export const viewport: Viewport = {
  themeColor: "#071018",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${syne.variable} ${dmSans.variable} dark h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)] bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
