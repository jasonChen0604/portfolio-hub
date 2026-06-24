"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import { ProductGroupCard } from "./ProductGroupCard";
import { useLang } from "@/lib/i18n/context";
import type { ProductGroup } from "@/lib/data/types";

const statusOrder = ["Production", "In Progress", "Completed", "Archived"];

const t = {
  en: { title: "Products & Experience", subtitle: "23 product groups shipped across enterprise, healthcare, e-commerce, and fintech" },
  zh: { title: "產品與工作經歷", subtitle: "橫跨企業、醫療、電商與金融科技的 23 個產品群組" },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export function ProductListClient({
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Typography level="h1" sx={{ mb: 1 }}>
          {tx.title}
        </Typography>
        <Typography level="body-lg" color="neutral" sx={{ mb: 5 }}>
          {tx.subtitle}
        </Typography>
      </motion.div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {groups.map((group) => (
          <motion.div key={group.product_name} variants={item}>
            <ProductGroupCard group={group} />
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
}
