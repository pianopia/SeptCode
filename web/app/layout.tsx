import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
  title: "Septima",
  description: "7行コードを共有するSNS"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={`${sans.variable} ${mono.variable} ${display.variable}`}>
        <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
