import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بستان الأصول",
    short_name: "بستان الأصول",
    description: "منصة لتسجيل وعرض أشجار العائلات وربطها ببعضها",
    start_url: withBasePath("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1a14",
    theme_color: "#0f1a14",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: withBasePath("/icons/icon-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/maskable-icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/icons/icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
