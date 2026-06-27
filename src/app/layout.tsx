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
    "Real-time winddashboard voor watersporters in IJmuiden. RWS live-metingen gecombineerd met HARMONIE, ECMWF, ICON-D2 en GFS voorspellingen.",
  applicationName: "IJmuiden Wind Intelligence",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IJmuiden Wind",
  },
  openGraph: {
    title: "IJmuiden Wind Intelligence",
    description: "Kun je vandaag kiten in IJmuiden?",
    type: "website",
    locale: "nl_NL",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef2f7",
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
    <html lang="nl" className={`${syne.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)] bg-background text-foreground antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
