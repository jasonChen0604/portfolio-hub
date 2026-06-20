"use client";

import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";
import Link from "next/link";
import type { ProductGroup } from "@/lib/data/types";
import { productNameToSlug } from "@/lib/data/loaders";
import { useLang } from "@/lib/i18n/context";

const statusColor = {
  Production: "success",
  "In Progress": "warning",
  Completed: "neutral",
  Archived: "neutral",
} as const;

export function ProductGroupCard({ group }: { group: ProductGroup }) {
  const { lang } = useLang();
  const slug = productNameToSlug(group.product_name);

  return (
    <Card
      component={Link}
      href={`/experience/${slug}`}
      variant="outlined"
      sx={{
        textDecoration: "none",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "md" },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Chip
            size="sm"
            variant="soft"
            color={statusColor[group.status] ?? "neutral"}
          >
            {group.status}
          </Chip>
          <Typography level="body-sm" color="neutral">
            {group.project_count} {lang === "zh" ? "個專案" : "projects"}
          </Typography>
        </Box>
        <Typography level="title-lg" sx={{ mb: 1.5 }}>
          {group.product_name}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {group.roles.map((role) => (
            <Chip key={role} size="sm" variant="outlined" color="neutral">
              {role}
            </Chip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
