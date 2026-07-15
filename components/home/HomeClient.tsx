"use client";

import Box from "@mui/joy/Box";
import Divider from "@mui/joy/Divider";
import { domainData } from "@/lib/data/loaders";
import type { ProfileMeta } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { FeaturedProjects } from "./FeaturedProjects";
import { HeroSection } from "./HeroSection";
import { HighlightStats } from "./HighlightStats";

export function HomeClient({
	metaEn,
	metaZh,
}: {
	metaEn: ProfileMeta;
	metaZh: ProfileMeta;
}) {
	const { lang } = useLang();
	const meta = lang === "zh" ? metaZh : metaEn;

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
