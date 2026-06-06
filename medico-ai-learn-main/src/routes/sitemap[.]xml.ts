import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://dent-ai-learn.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/auth", changefreq: "monthly", priority: "0.5" },
          { path: "/reset-password", changefreq: "monthly", priority: "0.3" },
          { path: "/doubt", changefreq: "weekly", priority: "0.8" },
          { path: "/quiz", changefreq: "daily", priority: "0.9" },
          { path: "/quiz/challenge", changefreq: "daily", priority: "0.8" },
          { path: "/recap", changefreq: "weekly", priority: "0.8" },
          { path: "/flashcards", changefreq: "weekly", priority: "0.8" },
          { path: "/goals", changefreq: "weekly", priority: "0.7" },
          { path: "/marks", changefreq: "weekly", priority: "0.7" },
          { path: "/suggestions", changefreq: "weekly", priority: "0.7" },
          { path: "/timer", changefreq: "weekly", priority: "0.8" },
          { path: "/bookmarks", changefreq: "weekly", priority: "0.6" },
          { path: "/settings", changefreq: "monthly", priority: "0.5" },
          { path: "/notes", changefreq: "weekly", priority: "0.8" },
          { path: "/study-plan", changefreq: "weekly", priority: "0.8" },
          { path: "/viva", changefreq: "weekly", priority: "0.8" },
          { path: "/pyq", changefreq: "weekly", priority: "0.8" },
          { path: "/analytics", changefreq: "weekly", priority: "0.7" },
          { path: "/case-study", changefreq: "weekly", priority: "0.8" },
          { path: "/diagram-quiz", changefreq: "weekly", priority: "0.8" },
          { path: "/drill", changefreq: "weekly", priority: "0.8" },
          { path: "/mistakes", changefreq: "weekly", priority: "0.7" },
          { path: "/mock-exam", changefreq: "weekly", priority: "0.8" },
          { path: "/formula-sheet", changefreq: "weekly", priority: "0.8" },
          { path: "/challenge", changefreq: "daily", priority: "0.8" },
          { path: "/osce", changefreq: "weekly", priority: "0.8" },
          { path: "/cases", changefreq: "weekly", priority: "0.8" },
          { path: "/diagram-explain", changefreq: "weekly", priority: "0.8" },
          { path: "/summarizer", changefreq: "weekly", priority: "0.9" },
          { path: "/recorder", changefreq: "weekly", priority: "0.9" },
          { path: "/practice", changefreq: "daily", priority: "0.9" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
