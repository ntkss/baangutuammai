import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { UI_TEXT } from "@/lib/i18n/th";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: UI_TEXT.appName + " — " + UI_TEXT.appTagline,
  description: UI_TEXT.appDescription,
  keywords: [
    "น้ำท่วม",
    "ความเสี่ยงน้ำท่วม",
    "ระดับน้ำ",
    "ไทย",
    "flood risk",
    "Thailand",
  ],
  openGraph: {
    title: UI_TEXT.appName,
    description: UI_TEXT.appTagline,
    locale: "th_TH",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="text-thai">{children}</body>
    </html>
  );
}
