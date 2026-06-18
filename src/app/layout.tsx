import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

/** Display face for headings + UI chrome — geometric, technical, modern. */
const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/** Body / interface text — clean and highly legible at small sizes. */
const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Srikanta Mishra — Open-World Portfolio",
  description:
    "An explorable open-world portfolio. Walk, drive, and discover projects, story, and skills.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b1026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
