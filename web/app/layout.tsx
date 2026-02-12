import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono, Manrope } from "next/font/google";
import { BottomTabs } from "@/components/BottomTabs";
import { getSessionUserId } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });

const siteUrl = getSiteUrl();
const defaultOgImage = `${siteUrl}/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SeptCode",
  description: "7行コードを共有するSNS",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "SeptCode",
    title: "SeptCode",
    description: "7行コードを共有するSNS",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "SeptCode"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "SeptCode",
    description: "7行コードを共有するSNS",
    images: [defaultOgImage]
  }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await getSessionUserId();

  return (
    <html lang="ja">
      <body className={`${sans.variable} ${mono.variable} ${display.variable}`}>
        <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
        <BottomTabs userId={userId} />
      </body>
    </html>
  );
}
