import Chip from "@mui/joy/Chip";
import type { ProficiencyLevel } from "@/lib/data/types";

const config: Record<ProficiencyLevel, { color: "primary" | "neutral"; variant: "solid" | "soft" | "outlined" }> = {
  expert: { color: "primary", variant: "solid" },
  proficient: { color: "neutral", variant: "soft" },
  familiar: { color: "neutral", variant: "outlined" },
};

const label: Record<ProficiencyLevel, { en: string; zh: string }> = {
  expert: { en: "Expert", zh: "精通" },
  proficient: { en: "Proficient", zh: "熟練" },
  familiar: { en: "Familiar", zh: "熟悉" },
};

export function ProficiencyBadge({
  level,
  lang = "en",
}: {
  level: ProficiencyLevel;
  lang?: "en" | "zh";
}) {
  const { color, variant } = config[level];
  return (
    <Chip size="sm" color={color} variant={variant}>
      {label[level][lang]}
    </Chip>
  );
}
