import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteNav } from "@/components/ui/SiteNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tabulens",
    template: "%s · Tabulens",
  },
  description: "Find leakage, contamination and dirty data in a CSV before you train on it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <MotionProvider>
          <SiteNav />
          {children}
          <SiteFooter />
        </MotionProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
