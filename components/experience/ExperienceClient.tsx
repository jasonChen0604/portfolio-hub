"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { ProductGroupCard } from "./ProductGroupCard";
import { useLang } from "@/lib/i18n/context";
import type { ProductGroup } from "@/lib/data/types";

const statusOrder = ["Production", "In Progress", "Completed", "Archived"];

const t = {
  en: { title: "Products & Experience", subtitle: "23 product groups shipped across enterprise, healthcare, e-commerce, and fintech" },
  zh: { title: "產品與工作經歷", subtitle: "橫跨企業、醫療、電商與金融科技的 23 個產品群組" },
};

export function ExperienceClient({
  groupsEn,
  groupsZh,
}: {
  groupsEn: ProductGroup[];
  groupsZh: ProductGroup[];
}) {
  const { lang } = useLang();
  const tx = t[lang];
  const groups = (lang === "zh" ? groupsZh : groupsEn).slice().sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

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
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {groups.map((group) => (
          <ProductGroupCard key={group.product_name} group={group} />
        ))}
      </Box>
    </Box>
  );
}
