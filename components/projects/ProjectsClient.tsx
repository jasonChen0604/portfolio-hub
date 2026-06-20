"use client";

import { useState, useMemo } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { ProjectCard } from "./ProjectCard";
import { ProjectFilters, type Filters } from "./ProjectFilters";
import { useLang } from "@/lib/i18n/context";
import type { Project } from "@/lib/data/types";

const t = {
  en: { title: "Projects", subtitle: "All projects across every domain" },
  zh: { title: "專案列表", subtitle: "橫跨各技術領域的所有專案" },
};

export function ProjectsClient({
  projectsEn,
  projectsZh,
}: {
  projectsEn: Project[];
  projectsZh: Project[];
}) {
  const { lang } = useLang();
  const tx = t[lang];
  const projects = lang === "zh" ? projectsZh : projectsEn;

  const [filters, setFilters] = useState<Filters>({
    domain: "",
    status: "",
    category: "",
  });

  const domains = useMemo(
    () => [...new Set(projects.map((p) => p.domain_primary))].sort(),
    [projects]
  );
  const statuses = useMemo(
    () => [...new Set(projects.map((p) => p.status))].sort(),
    [projects]
  );
  const categories = useMemo(
    () => [...new Set(projects.map((p) => p.category))].sort(),
    [projects]
  );

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (!filters.domain || p.domain_primary === filters.domain) &&
          (!filters.status || p.status === filters.status) &&
          (!filters.category || p.category === filters.category)
      ),
    [projects, filters]
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: 6 }}>
      <Typography level="h1" sx={{ mb: 1 }}>
        {tx.title}
      </Typography>
      <Typography level="body-lg" color="neutral" sx={{ mb: 4 }}>
        {tx.subtitle}
      </Typography>
      <ProjectFilters
        filters={filters}
        setFilters={setFilters}
        domains={domains}
        statuses={statuses}
        categories={categories}
        count={filtered.length}
        total={projects.length}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </Box>
    </Box>
  );
}
