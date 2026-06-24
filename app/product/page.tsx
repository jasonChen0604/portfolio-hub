import type { Metadata } from "next";
import { ProductListClient } from "@/components/product/ProductListClient";
import { productGroupData } from "@/lib/data/loaders";

export const metadata: Metadata = {
  title: "Products",
  description:
    "23 product groups shipped to production across enterprise, healthcare, e-commerce, and fintech domains.",
  openGraph: {
    title: "Products — Jason Chen",
    description:
      "23 product groups shipped to production across enterprise, healthcare, e-commerce, and fintech domains.",
  },
};

export default function ProductPage() {
  return (
    <ProductListClient
      groupsEn={productGroupData.en}
      groupsZh={productGroupData.zh}
    />
  );
}
