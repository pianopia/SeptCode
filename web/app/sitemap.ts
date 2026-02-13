import type { MetadataRoute } from "next";
import { parseDbTimestamp } from "@/lib/datetime";
import { getPostSitemapEntries } from "@/lib/queries";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const posts = await getPostSitemapEntries();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "hourly",
      priority: 1
    }
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.publicId}`,
    lastModified: parseDbTimestamp(post.createdAt),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticPages, ...postPages];
}
