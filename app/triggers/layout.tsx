import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5 สัญญาณวิกฤตน้ำท่วมบ้าน — จุดชี้ชะตา",
  description:
    "เช็ก 5 สัญญาณและเงื่อนไขวิกฤตที่ทำให้น้ำท่วมถึงบ้านคุณ: การระบายน้ำเขื่อนเจ้าพระยา (C.13), ปริมาณน้ำเหนือ (C.2), ฝนตกหนักสะสม, ความจุ 4 เขื่อนใหญ่ และระดับตลิ่ง",
  openGraph: {
    title: "5 สัญญาณวิกฤตน้ำท่วมบ้าน — จุดชี้ชะตา",
    description:
      "เช็ก 5 สัญญาณและเงื่อนไขวิกฤตที่ทำให้น้ำท่วมถึงบ้านคุณ หากครบเงื่อนไขเตรียมยกของหนีน้ำทันที",
    url: "/triggers",
    images: [
      {
        url: "/og-image.jpg",
        width: 1024,
        height: 765,
        alt: "บ้านกูจะน้ำท่วมมั้ย 5 สัญญาณวิกฤตน้ำท่วมบ้าน",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "5 สัญญาณวิกฤตน้ำท่วมบ้าน — จุดชี้ชะตา",
    description:
      "เช็ก 5 สัญญาณและเงื่อนไขวิกฤตที่ทำให้น้ำท่วมถึงบ้านคุณ หากครบเงื่อนไขเตรียมยกของหนีน้ำทันที",
    images: ["/og-image.jpg"],
  },
};

export default function TriggersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
