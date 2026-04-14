import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import BottomTabBar from "./components/BottomTabBar";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import { ScoreWeightsProvider } from "./components/ScoreWeightsProvider";
import { WatchlistProvider } from "./components/Watchlist";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  title: "EGX Analytics — Egyptian Stock Market Terminal",
  description:
    "Analyze Egyptian Exchange stocks with technical indicators, portfolio tracking, and educational insights.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EGX Analytics",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/egx-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/egx-favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/egx-apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <ServiceWorkerRegistrar />
        <ScoreWeightsProvider>
          <WatchlistProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="pb-[60px] md:pb-4 pt-4 text-center text-xs text-white/40">
              By Mark Botros
            </footer>
            <BottomTabBar />
          </WatchlistProvider>
        </ScoreWeightsProvider>
      </body>
    </html>
  );
}
