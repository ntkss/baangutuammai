import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เช็กลิสต์เทียบกับมหาอุทกภัยปี 2554",
  description:
    "เปรียบเทียบมวลน้ำปัจจุบันกับปี 2554 ทั้งสถานี C.13 เขื่อนเจ้าพระยา, C.2 นครสวรรค์ และปริมาณน้ำใน 4 เขื่อนหลัก",
  openGraph: {
    title: "เช็กลิสต์เทียบกับมหาอุทกภัยปี 2554 | บ้านกูจะน้ำท่วมมั้ย",
    description:
      "เปรียบเทียบมวลน้ำปัจจุบันกับปี 2554 ทั้งสถานี C.13 เขื่อนเจ้าพระยา, C.2 นครสวรรค์ และ 4 เขื่อนใหญ่",
    url: "/2554",
    images: [
      {
        url: "/og-image.jpg",
        width: 1024,
        height: 765,
        alt: "บ้านกูจะน้ำท่วมมั้ย เช็กลิสต์เทียบกับมหาอุทกภัยปี 2554",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "เช็กลิสต์เทียบกับมหาอุทกภัยปี 2554 | บ้านกูจะน้ำท่วมมั้ย",
    description:
      "เปรียบเทียบมวลน้ำปัจจุบันกับปี 2554 ทั้งสถานี C.13 เขื่อนเจ้าพระยา, C.2 นครสวรรค์ และ 4 เขื่อนใหญ่",
    images: ["/og-image.jpg"],
  },
};

export default function History2554Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
