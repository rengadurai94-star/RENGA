import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./closebook.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Closebook — Your AI junior bookkeeper",
  description:
    "Closebook is an AI junior bookkeeper for small businesses. Transactions categorized daily, books closed by day 5, every close reviewed by a CPA.",
};

export default function ClosebookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
