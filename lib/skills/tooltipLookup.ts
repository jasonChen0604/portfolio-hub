import { productGroupData, productNameToSlug } from "@/lib/data/loaders";
import type { Lang } from "@/lib/data/types";

export interface TooltipProduct {
  productName: string;
  productSlug: string;
  projectCount: number;
}

export interface SkillTooltipData {
  skillTag: string;
  level: string;
  projectCount: number;
  topProducts: TooltipProduct[];
  extraCount: number;
}

const MAX_PRODUCTS = 5;

export function resolveSkillTooltip(
  skillTag: string,
  projectIds: string[],
  projectCount: number,
  skillLevel: string,
  lang: Lang
): SkillTooltipData {
  const groups = productGroupData[lang];

  // build projectId → productName reverse map
  const idToProduct = new Map<string, string>();
  for (const group of groups) {
    for (const pp of group.projects) {
      idToProduct.set(pp.id, group.product_name);
    }
  }

  // count projects per product for this skill
  const productCount = new Map<string, number>();
  for (const id of projectIds) {
    const name = idToProduct.get(id);
    if (name) productCount.set(name, (productCount.get(name) ?? 0) + 1);
  }

  const sorted = [...productCount.entries()].sort((a, b) => b[1] - a[1]);
  const visible = sorted.slice(0, MAX_PRODUCTS);
  const extraCount = sorted.length - visible.length;

  const topProducts: TooltipProduct[] = visible.map(([productName, count]) => ({
    productName,
    productSlug: productNameToSlug(productName),
    projectCount: count,
  }));

  return { skillTag, level: skillLevel ?? "", projectCount, topProducts, extraCount };
}
