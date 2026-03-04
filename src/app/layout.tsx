import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Force all pages to render dynamically (not pre-rendered at build time)
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Comment Sentiment Analyzer",
  description: "Unlock the true potential behind your YouTube comments with advanced sentiment analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
