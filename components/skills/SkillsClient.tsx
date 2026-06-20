"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { DomainCard } from "./DomainCard";
import { useLang } from "@/lib/i18n/context";
import type { Domain } from "@/lib/data/types";

const t = {
  en: { title: "Skills & Expertise", subtitle: "9 domains · 1,976+ unique technologies" },
  zh: { title: "技能與專業", subtitle: "9 個技術領域 · 1,976+ 個技術標籤" },
};

export function SkillsClient({
  domainsEn,
  domainsZh,
}: {
  domainsEn: Domain[];
  domainsZh: Domain[];
}) {
  const { lang } = useLang();
  const tx = t[lang];
  const domains = lang === "zh" ? domainsZh : domainsEn;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: 6 }}>
      <Typography level="h1" sx={{ mb: 1 }}>
        {tx.title}
      </Typography>
      <Typography level="body-lg" color="neutral" sx={{ mb: 5 }}>
        {tx.subtitle}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        {domains.map((domain) => (
          <DomainCard key={domain.id} domain={domain} />
        ))}
      </Box>
    </Box>
  );
}
