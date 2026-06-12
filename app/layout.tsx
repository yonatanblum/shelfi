import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";

import { RootClientProviders } from "@/components/providers/RootClientProviders";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shelfi | Retail Intelligence",
  description:
    "Pharmacy shelf image analysis dashboard for retail intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <RootClientProviders>{children}</RootClientProviders>
      </body>
    </html>
  );
}
