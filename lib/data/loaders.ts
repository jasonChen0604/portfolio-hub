import domainsEnRaw from "@/tech-profile/domains-en.json";
import domainsZhRaw from "@/tech-profile/domains-zh.json";
import metaEnRaw from "@/tech-profile/meta-en.json";
import metaZhRaw from "@/tech-profile/meta-zh.json";
import productGroupsEnRaw from "@/tech-profile/product-groups-en.json";
import productGroupsZhRaw from "@/tech-profile/product-groups-zh.json";
import resumeEnRaw from "@/tech-profile/resume-en.json";
import resumeZhRaw from "@/tech-profile/resume-zh.json";
import type { Domain, ProductGroup, ProfileMeta, Resume } from "./types";

export const metaData: Record<"en" | "zh", ProfileMeta> = {
	en: metaEnRaw as ProfileMeta,
	zh: metaZhRaw as ProfileMeta,
};

export const meta = metaData.en;

export const resumeData: Record<"en" | "zh", Resume> = {
	en: resumeEnRaw as Resume,
	zh: resumeZhRaw as Resume,
};

export const domainData: Record<"en" | "zh", Domain[]> = {
	en: domainsEnRaw as Domain[],
	zh: domainsZhRaw as Domain[],
};

export const productGroupData: Record<"en" | "zh", ProductGroup[]> = {
	en: productGroupsEnRaw as ProductGroup[],
	zh: productGroupsZhRaw as ProductGroup[],
};

export function productNameToSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.trim()
		.replace(/\s+/g, "-");
}

export function slugToProductGroup(
	slug: string,
	lang: "en" | "zh" = "en",
): ProductGroup | undefined {
	// ponytail: zh product names are localized text, not slugifiable — match by
	// position in the en-derived slug list since both files share the same order
	const index = productGroupData.en.findIndex(
		(g) => productNameToSlug(g.product_name) === slug,
	);
	return index === -1 ? undefined : productGroupData[lang][index];
}

export function getAllSlugs(): string[] {
	return productGroupData.en.map((g) => productNameToSlug(g.product_name));
}

export function getProductSlugForProject(
	projectId: string,
): string | undefined {
	const group = productGroupData.en.find((g) =>
		g.projects.some((p) => p.id === projectId),
	);
	return group ? productNameToSlug(group.product_name) : undefined;
}
