"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Divider from "@mui/joy/Divider";
import { motion } from "framer-motion";
import { SkillsCategoryGroup } from "./SkillsCategoryGroup";
import type { DomainVisualConfig, CategoryConfig } from "@/lib/skills/hierarchyConfig";
import { languageSkills } from "@/lib/skills/hierarchyConfig";
import type { Domain } from "@/lib/data/types";
import { resolveSkillTooltip, type SkillTooltipData } from "@/lib/skills/tooltipLookup";
import { useLang } from "@/lib/i18n/context";

// must match the fixed header height in layout.tsx / Header.tsx
const HEADER_H = 57;

interface Props {
  domainCfg: DomainVisualConfig;
  categories: CategoryConfig[];
  domains: Domain[];
  onSkillClick: (data: SkillTooltipData, anchor: Element) => void;
  index?: number;
}

export function SkillsDomainSection({ domainCfg, categories, domains, onSkillClick, index = 0 }: Props) {
  const { lang } = useLang();
  const rawDomain = domains.find((d) => d.id === domainCfg.domainId);
  const label = lang === "zh" ? domainCfg.labelZh : domainCfg.label;
  const skillMap = new Map(
    (rawDomain?.skills ?? []).map((s) => [s.tag.toLowerCase(), s])
  );
  const summary = rawDomain?.summary ?? (lang === "zh" ? domainCfg.summaryZh : domainCfg.summaryEn);

  return (
    <motion.section
      id={`domain-${domainCfg.domainId}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      style={{ scrollMarginTop: HEADER_H + 8, marginBottom: 48 }}
    >
      {/* ── Sticky domain header — pins to top while section is in view ── */}
      <Box
        sx={{
          position: "sticky",
          top: HEADER_H,
          zIndex: 40,
          bgcolor: "var(--joy-palette-background-body)",
          backdropFilter: "blur(6px)",
          pt: 1.5,
          pb: 1,
          mb: 2,
          borderLeft: `4px solid ${domainCfg.color}`,
          pl: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          // ponytail: ::before fills the gap between fixed header bottom and sticky top
          "&::before": {
            content: '""',
            position: "absolute",
            top: -HEADER_H,
            left: 0,
            right: 0,
            height: HEADER_H,
            bgcolor: "var(--joy-palette-background-body)",
            zIndex: -1,
          },
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.8 }}
          transition={{ duration: 0.22 }}
          style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
        >
          <Typography level="h3" sx={{ color: domainCfg.color, fontWeight: "bold", lineHeight: 1.2 }}>
            {rawDomain?.icon ?? domainCfg.icon}&nbsp;{label}
          </Typography>
          {rawDomain && (
            <Chip
              size="sm"
              variant="outlined"
              sx={{
                color: domainCfg.color,
                borderColor: `color-mix(in srgb, ${domainCfg.color} 50%, transparent)`,
              }}
            >
              {rawDomain.project_count} projects
            </Chip>
          )}
        </motion.div>
      </Box>

      {/* ── Content ── */}
      {domainCfg.domainId === "languages" ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pl: 1 }}>
          {languageSkills.map((tag, i) => {
            const s = skillMap.get(tag.toLowerCase());
            return (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                whileHover={{ scale: 1.08 }}
              >
                <Chip
                  size="md"
                  variant="soft"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!s) return;
                    onSkillClick(resolveSkillTooltip(tag, s.projects ?? [], s.project_count, s.level, lang), e.currentTarget);
                  }}
                  sx={{
                    cursor: s ? "pointer" : "default",
                    bgcolor: `color-mix(in srgb, ${domainCfg.color} 15%, transparent)`,
                    color: domainCfg.color,
                    border: "1px solid",
                    borderColor: `color-mix(in srgb, ${domainCfg.color} 40%, transparent)`,
                    fontWeight: s?.level === "expert" ? "lg" : "normal",
                  }}
                >
                  {tag}
                </Chip>
              </motion.div>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ pl: 2.5 }}>
          {summary && (
            <Typography level="body-sm" color="neutral" sx={{ mb: 2.5, maxWidth: 640 }}>
              {summary}
            </Typography>
          )}
          {categories.map((cat) => (
            <SkillsCategoryGroup
              key={cat.id}
              category={cat}
              domains={domains}
              color={domainCfg.color}
              onSkillClick={onSkillClick}
            />
          ))}
        </Box>
      )}

      <Divider sx={{ mt: 2 }} />
    </motion.section>
  );
}
