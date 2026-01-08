import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "통화녹음 관리",
  description: "스마트한 통화 녹음 - 모든 순간을 기록하세요",
  openGraph: {
    title: "통화녹음 관리",
    description: "스마트한 통화 녹음 - 모든 순간을 기록하세요",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "통화녹음 관리 시스템",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "통화녹음 관리",
    description: "스마트한 통화 녹음 - 모든 순간을 기록하세요",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
