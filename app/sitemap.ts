import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/data/loaders";

export const dynamic = "force-static";

const BASE_URL = "https://jason-chen-1cb56.web.app";

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes = ["", "/product", "/skills", "/about"].map((path) => ({
		url: `${BASE_URL}${path}`,
	}));

	const productRoutes = getAllSlugs().map((slug) => ({
		url: `${BASE_URL}/product/${slug}`,
	}));

	return [...staticRoutes, ...productRoutes];
}
