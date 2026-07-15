import type { Domain, ProductGroup, ProfileMeta, Resume } from "./types";

import metaRaw from "@/tech-profile/meta.json";
import domainsEnRaw from "@/tech-profile/domains-en.json";
import domainsZhRaw from "@/tech-profile/domains-zh.json";
import productGroupsEnRaw from "@/tech-profile/product-groups-en.json";
import productGroupsZhRaw from "@/tech-profile/product-groups-zh.json";
import resumeEnRaw from "@/tech-profile/resume-en.json";
import resumeZhRaw from "@/tech-profile/resume-zh.json";

export const meta = metaRaw as ProfileMeta;

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
  lang: "en" | "zh" = "en"
): ProductGroup | undefined {
  return productGroupData[lang].find(
    (g) => productNameToSlug(g.product_name) === slug
  );
}

export function getAllSlugs(): string[] {
  return productGroupData.en.map((g) => productNameToSlug(g.product_name));
}
