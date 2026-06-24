"use client";

import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import { useLang } from "@/lib/i18n/context";
import { getFeaturedProjects } from "@/lib/data/projects";

const t = {
  en: { title: "Featured Projects" },
  zh: { title: "精選專案" },
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
        }}
      >
        {featured.map((p) => (
          <Card key={p.id} variant="outlined">
            <CardContent>
              <Typography level="title-md" sx={{ mb: 1 }}>{p.name}</Typography>
              <Typography level="body-sm" color="neutral" sx={{ mb: 2 }}>
                {p.description}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {p.tags.slice(0, 5).map((tag) => (
                  <Chip key={tag} size="sm" variant="outlined" color="neutral">{tag}</Chip>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
