"use client";

import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";
import type { Project } from "@/lib/data/types";
import { productNameToSlug, productGroupData } from "@/lib/data/loaders";
import { useLang } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";

const statusColor = {
  Production: "success",
  "In Progress": "warning",
  Completed: "neutral",
  Archived: "neutral",
} as const;

function findProductSlug(projectId: string, lang: "en" | "zh"): string | null {
  const groups = productGroupData[lang];
  const group = groups.find((g) => g.projects.some((p) => p.id === projectId));
  return group ? productNameToSlug(group.product_name) : null;
}

export function ProjectCard({ project }: { project: Project }) {
  const { lang } = useLang();
  const router = useRouter();
  const slug = findProductSlug(project.id, lang);

  function handleClick() {
    if (slug) {
      router.push(`/experience/${slug}#${project.id}`);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        cursor: slug ? "pointer" : "default",
        transition: "box-shadow 0.2s",
        "&:hover": slug ? { boxShadow: "md" } : {},
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Chip size="sm" variant="soft" color="primary">
            {project.category}
          </Chip>
          <Chip
            size="sm"
            variant="soft"
            color={statusColor[project.status] ?? "neutral"}
          >
            {project.status}
          </Chip>
        </Box>
        <Typography level="title-md" sx={{ mb: 1 }}>
          {project.name}
        </Typography>
        <Typography level="body-sm" color="neutral" sx={{ mb: 2, flexGrow: 1 }}>
          {project.description}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {project.tags.slice(0, 5).map((tag) => (
            <Chip key={tag} size="sm" variant="outlined" color="neutral">
              {tag}
            </Chip>
          ))}
          {project.tags.length > 5 && (
            <Chip size="sm" variant="plain" color="neutral">
              +{project.tags.length - 5}
            </Chip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
