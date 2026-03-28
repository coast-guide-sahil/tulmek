import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TULMEK — Interview Prep Knowledge Hub",
    short_name: "TULMEK",
    description:
      "AI-powered interview prep content aggregator. Fresh content daily from HackerNews, Reddit, dev.to, YouTube.",
    start_url: "/hub",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait-primary",
    categories: ["education", "productivity", "news"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
