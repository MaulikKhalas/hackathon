import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "CallAura AI · Call Intelligence",
  description:
    "Upload calls, get transcripts, scores, sentiment, discovery coverage, and follow-up actions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen font-sans`}
      >
        <div className="analytics-grid fixed inset-0 -z-10 opacity-40" />
        {children}
      </body>
    </html>
  );
}
