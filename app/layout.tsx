import type { Metadata } from "next";
import "./globals.css";
import MarqueeBar from "@/components/MarqueeBar";

export const metadata: Metadata = {
  title: "💕 男友積分本",
  description: "記錄男友的好行為，兌換甜蜜獎勵",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ec4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-full flex flex-col bg-pink-50">
        <MarqueeBar />
        {children}
      </body>
    </html>
  );
}
