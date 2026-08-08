import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ['', '/products', '/cart', '/login', '/signup', '/wishlist'].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.7,
  }));

  return [...staticRoutes];
}