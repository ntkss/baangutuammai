import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "แผนที่สถานีวัดน้ำและระดับความเสี่ยง",
  description:
    "แผนที่แสดงตำแหน่งสถานีวัดระดับน้ำ สถานีวัดน้ำฝน และระดับความเสี่ยงรอบบ้านคุณ",
  openGraph: {
    title: "แผนที่สถานีวัดน้ำและระดับความเสี่ยง | บ้านกูจะน้ำท่วมมั้ย",
    description:
      "ดูแผนที่ระดับน้ำและสถานีโทรมาตรทั่วลุ่มน้ำเจ้าพระยาและพื้นที่ใกล้บ้านคุณ",
    url: "/map",
    images: [
      {
        url: "/og-image.jpg",
        width: 1024,
        height: 765,
        alt: "บ้านกูจะน้ำท่วมมั้ย แผนที่สถานีวัดน้ำ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "แผนที่สถานีวัดน้ำและระดับความเสี่ยง | บ้านกูจะน้ำท่วมมั้ย",
    description:
      "ดูแผนที่ระดับน้ำและสถานีโทรมาตรทั่วลุ่มน้ำเจ้าพระยาและพื้นที่ใกล้บ้านคุณ",
    images: ["/og-image.jpg"],
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
