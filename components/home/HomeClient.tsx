"use client";

import Box from "@mui/joy/Box";
import Divider from "@mui/joy/Divider";
import { HeroSection } from "./HeroSection";
import { HighlightStats } from "./HighlightStats";
import { FeaturedProjects } from "./FeaturedProjects";
import { domainData } from "@/lib/data/loaders";
import type { ProfileMeta } from "@/lib/data/types";

export function HomeClient({ meta }: { meta: ProfileMeta }) {
  return (
    <Box>
      <HeroSection meta={meta} />
      <Divider sx={{ mb: 4 }} />
      <HighlightStats
        years={meta.profile.years_of_experience}
        projects={meta.profile.total_projects}
        domains={domainData.en.length}
      />
      <FeaturedProjects />
    </Box>
  );
}
