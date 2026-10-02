import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "บ้านกูจะน้ำท่วมมั้ย — เช็กความเสี่ยงน้ำท่วมรอบบ้านคุณ",
    short_name: "น้ำท่วมไหม",
    description:
      "ประเมินความเสี่ยงน้ำท่วมรอบบ้านคุณแบบเรียลไทม์ ด้วยข้อมูลโทรมาตรระดับน้ำ ปริมาณฝน การระบายน้ำเขื่อนเจ้าพระยา จุดชี้ชะตาสัญญาณวิกฤต และเปรียบเทียบกับมหาอุทกภัยปี 2554",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
