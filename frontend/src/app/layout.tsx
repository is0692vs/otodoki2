import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { DevTools } from "@/components/DevTools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "otodoki2",
  description: "音楽発見とライブラリ管理のためのアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <AppHeader />
          <AudioPlayerProvider>
            <main className="flex-1">{children}</main>
          </AudioPlayerProvider>
        </div>
      </body>
    </html>
  );
}
