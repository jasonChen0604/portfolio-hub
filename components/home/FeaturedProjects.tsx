"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useLang } from "@/lib/i18n/context";
import { getFeaturedProjects } from "@/lib/data/projects";

const t = {
  en: { title: "Featured Projects", cta: "View All Projects" },
  zh: { title: "精選專案", cta: "查看全部專案" },
};

export function FeaturedProjects() {
  const { lang } = useLang();
  const tx = t[lang];
  const featured = getFeaturedProjects(lang);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, mb: 8 }}>
      <Typography level="h2" sx={{ mb: 3 }}>
        {tx.title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {featured.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Button component={Link} href="/projects" variant="outlined" color="neutral">
          {tx.cta}
        </Button>
      </Box>
    </Box>
  );
}
