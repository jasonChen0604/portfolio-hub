"use client";

import { motion } from "framer-motion";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import type { CategoryConfig } from "@/lib/skills/hierarchyConfig";
import type { Domain } from "@/lib/data/types";
import { resolveSkillTooltip, type SkillTooltipData } from "@/lib/skills/tooltipLookup";
import { useLang } from "@/lib/i18n/context";

const levelOpacity = { expert: 1, proficient: 0.75, familiar: 0.5 } as const;

interface Props {
  category: CategoryConfig;
  domains: Domain[];
  color: string;
  onSkillClick: (data: SkillTooltipData, anchor: Element) => void;
}

export function SkillsCategoryGroup({ category, domains, color, onSkillClick }: Props) {
  const { lang } = useLang();

  // build a flat tag→skill lookup from raw domain data
  const skillMap = new Map(
    domains.flatMap((d) => d.skills.map((s) => [s.tag.toLowerCase(), s]))
  );

  const label = lang === "zh" ? category.labelZh : category.label;

  return (
    <Box id={`cat-${category.id}`} sx={{ mb: 3, scrollMarginTop: "120px" }}>
      <Typography
        level="body-xs"
        fontWeight="lg"
        sx={{ mb: 1, letterSpacing: "0.06em", textTransform: "uppercase", color }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {[...new Set(category.skills)].map((tag, i) => {
          const skillData = skillMap.get(tag.toLowerCase());
          const opacity = skillData
            ? (levelOpacity[skillData.level as keyof typeof levelOpacity] ?? 0.5)
            : 0.4;

          return (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              whileHover={{ scale: 1.08, opacity: 1 }}
            >
              <Chip
                size="sm"
                variant="soft"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!skillData) return;
                  onSkillClick(
                    resolveSkillTooltip(tag, skillData.projects ?? [], skillData.project_count, skillData.level, lang),
                    e.currentTarget
                  );
                }}
                sx={{
                  cursor: skillData ? "pointer" : "default",
                  bgcolor: `color-mix(in srgb, ${color} 15%, transparent)`,
                  color,
                  borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                  border: "1px solid",
                  fontWeight: skillData?.level === "expert" ? "lg" : "normal",
                  fontSize: skillData?.level === "expert" ? "0.8rem" : "0.75rem",
                  // ensure text stays readable on dark background
                  "--Chip-decoratorChildOffset": "0px",
                }}
              >
                {tag}
              </Chip>
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );
}
