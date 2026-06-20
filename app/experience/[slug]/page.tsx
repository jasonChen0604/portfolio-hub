import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/experience/ProductDetailClient";
import {
  getAllSlugs,
  slugToProductGroup,
  productNameToSlug,
} from "@/lib/data/loaders";
import { getAllProjects } from "@/lib/data/projects";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = slugToProductGroup(slug);
  if (!group) return {};

  const projectIds = group.projects.map((p) => p.id);
  const allEn = getAllProjects("en");
  const tags = [
    ...new Set(
      allEn
        .filter((p) => projectIds.includes(p.id))
        .flatMap((p) => p.tags)
    ),
  ].slice(0, 20);

  const description = `${group.product_name} — ${group.status} product by Jason Chen. Roles: ${group.roles.join(", ")}. ${group.project_count} projects.`;

  return {
    title: group.product_name,
    description,
    openGraph: { title: group.product_name, description },
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: group.product_name,
        description,
        author: { "@type": "Person", name: "Jason Chen" },
        keywords: tags.join(", "),
      }),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const groupEn = slugToProductGroup(slug, "en");
  const groupZh = slugToProductGroup(slug, "zh");

  if (!groupEn || !groupZh) notFound();

  return <ProductDetailClient groupEn={groupEn} groupZh={groupZh} />;
}
