"use client";

import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";
import { ProficiencyBadge } from "./ProficiencyBadge";
import type { Domain } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";

export function DomainCard({ domain }: { domain: Domain }) {
  const { lang } = useLang();

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <span style={{ fontSize: "1.5rem" }}>{domain.icon}</span>
          <Typography level="title-lg">{domain.label}</Typography>
          <Chip size="sm" variant="soft" color="primary" sx={{ ml: "auto" }}>
            {domain.project_count} {lang === "zh" ? "個專案" : "projects"}
          </Chip>
        </Box>
        <Typography level="body-sm" color="neutral" sx={{ mb: 2 }}>
          {domain.summary}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {domain.skills.map((skill) => (
            <Box
              key={skill.tag}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Chip size="sm" variant="plain" color="neutral">
                {skill.tag}
              </Chip>
              <ProficiencyBadge level={skill.level} lang={lang} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
