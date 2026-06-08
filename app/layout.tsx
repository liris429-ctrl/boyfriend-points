import type { Metadata } from "next";
import "./globals.css";

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
      </head>
      <body className="min-h-full flex flex-col bg-pink-50">{children}</body>
    </html>
  );
}
