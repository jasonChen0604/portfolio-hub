import type { Metadata } from "next";
import { SkillsClient } from "@/components/skills/SkillsClient";
import { domainData } from "@/lib/data/loaders";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "9 technical domains spanning Frontend, Backend, AI/LLM, DevOps, Mobile, and more — with 1,976+ unique technology tags across 124 projects.",
};

export default function SkillsPage() {
  return <SkillsClient domainsEn={domainData.en} domainsZh={domainData.zh} />;
}
