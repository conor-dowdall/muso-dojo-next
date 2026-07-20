import { type MetadataRoute } from "next";

const appName = "Muso Dojo";
const appDescription = "Play Music";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: appDescription,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#08090d",
    background_color: "#08090d",
    icons: [
      {
        src: "/logos/icon192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/icon512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logos/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
