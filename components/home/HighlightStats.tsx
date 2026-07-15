"use client";

import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import { useLang } from "@/lib/i18n/context";

const stats = (years: number, projects: number, domains: number) => [
  { en: `${years}+ Years`, zh: `${years}+ 年`, sub: { en: "Experience", zh: "工作經驗" } },
  { en: `${projects}`, zh: `${projects}`, sub: { en: "Projects Shipped", zh: "個專案" } },
  { en: `${domains}`, zh: `${domains}`, sub: { en: "Tech Domains", zh: "技術領域" } },
];

export function HighlightStats({
  years,
  projects,
  domains,
}: {
  years: number;
  projects: number;
  domains: number;
}) {
  const { lang } = useLang();
  const items = stats(years, projects, domains);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        gap: 2,
        maxWidth: 800,
        mx: "auto",
        px: { xs: 2, md: 4 },
        mb: 6,
      }}
    >
      {items.map((item) => (
        <Card
          key={item.en}
          variant="soft"
          color="primary"
          sx={{ textAlign: "center", py: 3 }}
        >
          <Typography level="h2">{lang === "zh" ? item.zh : item.en}</Typography>
          <Typography level="body-sm" color="neutral">
            {lang === "zh" ? item.sub.zh : item.sub.en}
          </Typography>
        </Card>
      ))}
    </Box>
  );
}
