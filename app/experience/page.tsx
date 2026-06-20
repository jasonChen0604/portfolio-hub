import type { Metadata } from "next";
import { ExperienceClient } from "@/components/experience/ExperienceClient";
import { productGroupData } from "@/lib/data/loaders";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "23 product groups shipped to production across enterprise, healthcare, e-commerce, and fintech domains.",
  openGraph: {
    title: "Experience — Jason Chen",
    description:
      "23 product groups shipped to production across enterprise, healthcare, e-commerce, and fintech domains.",
  },
};

export default function ExperiencePage() {
  return (
    <ExperienceClient
      groupsEn={productGroupData.en}
      groupsZh={productGroupData.zh}
    />
  );
}
