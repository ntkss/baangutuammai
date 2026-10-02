import type { Metadata, Viewport } from "next";
import { Anuphan, Inter } from "next/font/google";
import "./globals.css";

const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-anuphan",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://baangutuammai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "บ้านกูจะน้ำท่วมมั้ย — เช็กความเสี่ยงน้ำท่วมรอบบ้านคุณ",
    template: "%s | บ้านกูจะน้ำท่วมมั้ย",
  },
  description:
    "ประเมินความเสี่ยงน้ำท่วมรอบบ้านคุณแบบเรียลไทม์ ด้วยข้อมูลโทรมาตรระดับน้ำ ปริมาณฝน การระบายน้ำเขื่อนเจ้าพระยา จุดชี้ชะตาสัญญาณวิกฤต และเปรียบเทียบกับมหาอุทกภัยปี 2554",
  applicationName: "บ้านกูจะน้ำท่วมมั้ย",
  authors: [{ name: "บ้านกูจะน้ำท่วมมั้ย" }],
  generator: "Next.js",
  keywords: [
    "บ้านกูจะน้ำท่วมมั้ย",
    "บ้านกูท่วมไหม",
    "น้ำท่วม",
    "น้ำท่วมกรุงเทพ",
    "น้ำท่วมนนทบุรี",
    "เขื่อนเจ้าพระยา",
    "ระดับน้ำเจ้าพระยา",
    "เปรียบเทียบปี 2554",
    "เตือนภัยน้ำท่วม",
    "โทรมาตรน้ำท่วม",
    "ThaiWater",
    "C.13",
    "C.2",
  ],
  referrer: "origin-when-cross-origin",
  creator: "บ้านกูจะน้ำท่วมมั้ย",
  publisher: "บ้านกูจะน้ำท่วมมั้ย",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "น้ำท่วมไหม",
  },
  openGraph: {
    title: "บ้านกูจะน้ำท่วมมั้ย — เช็กความเสี่ยงน้ำท่วมรอบบ้านคุณ",
    description:
      "บ้านคุณจะรอดไหม? ประเมินความเสี่ยงน้ำท่วมแบบเรียลไทม์ พร้อมเช็ก 5 สัญญาณวิกฤต และเทียบมวลน้ำกับปี 2554",
    url: siteUrl,
    siteName: "บ้านกูจะน้ำท่วมมั้ย",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1024,
        height: 765,
        alt: "บ้านกูจะน้ำท่วมมั้ย ขอความอนุเคราะห์จากท่านผู้มีอำนาจ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "บ้านกูจะน้ำท่วมมั้ย — เช็กความเสี่ยงน้ำท่วมรอบบ้านคุณ",
    description:
      "บ้านคุณจะรอดไหม? ประเมินความเสี่ยงน้ำท่วมแบบเรียลไทม์ พร้อมเช็ก 5 สัญญาณวิกฤต และเทียบมวลน้ำกับปี 2554",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
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
    <html lang="th" className={`${anuphan.variable} ${inter.variable}`}>
      <body className="text-thai">{children}</body>
    </html>
  );
}
