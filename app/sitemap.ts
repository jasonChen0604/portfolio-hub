import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/data/loaders";
import { getAllSlugs as getAllBlogSlugs } from "@/lib/blog/posts";

export const dynamic = "force-static";

const BASE_URL = "https://jason-chen-1cb56.web.app";

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes = ["", "/product", "/skills", "/about", "/blog"].map(
		(path) => ({
			url: `${BASE_URL}${path}`,
		}),
	);

	const productRoutes = getAllSlugs().map((slug) => ({
		url: `${BASE_URL}/product/${slug}`,
	}));

	const blogRoutes = getAllBlogSlugs().map((slug) => ({
		url: `${BASE_URL}/blog/${slug}`,
	}));

	return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
