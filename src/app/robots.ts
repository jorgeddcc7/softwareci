import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cuenta", "/historial", "/recuperar"],
      },
    ],
    sitemap: "https://www.controladordocumentos.com/sitemap.xml",
  };
}