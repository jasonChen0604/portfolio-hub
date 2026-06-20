"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Button from "@mui/joy/Button";
import Divider from "@mui/joy/Divider";
import Link from "next/link";
import { ProjectItem } from "./ProjectItem";
import { useLang } from "@/lib/i18n/context";
import { getProject } from "@/lib/data/projects";
import type { ProductGroup } from "@/lib/data/types";

const statusColor = {
  Production: "success",
  "In Progress": "warning",
  Completed: "neutral",
  Archived: "neutral",
} as const;

const t = {
  en: { back: "← All Products", projects: "Projects" },
  zh: { back: "← 所有產品", projects: "個專案" },
};

export function ProductDetailClient({
  groupEn,
  groupZh,
}: {
  groupEn: ProductGroup;
  groupZh: ProductGroup;
}) {
  const { lang } = useLang();
  const tx = t[lang];
  const group = lang === "zh" ? groupZh : groupEn;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 4 }, py: 6 }}>
      <Button
        component={Link}
        href="/experience"
        variant="plain"
        color="neutral"
        size="sm"
        sx={{ mb: 3 }}
      >
        {tx.back}
      </Button>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 1, alignItems: "center" }}>
        <Chip
          variant="soft"
          color={statusColor[group.status] ?? "neutral"}
        >
          {group.status}
        </Chip>
        {group.roles.map((role) => (
          <Chip key={role} size="sm" variant="outlined" color="neutral">
            {role}
          </Chip>
        ))}
        <Typography level="body-sm" color="neutral" sx={{ ml: "auto" }}>
          {group.project_count} {tx.projects}
        </Typography>
      </Box>

      <Typography level="h1" sx={{ mb: 4 }}>
        {group.product_name}
      </Typography>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {group.projects.map((pp) => {
          const project = getProject(pp.id, lang);
          if (!project) return null;
          return (
            <ProjectItem key={pp.id} project={project} productProject={pp} />
          );
        })}
      </Box>
    </Box>
  );
}
