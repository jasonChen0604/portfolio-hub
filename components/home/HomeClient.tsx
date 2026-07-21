"use client";

import Box from "@mui/joy/Box";
import { motion, useScroll, useSpring } from "framer-motion";
import { domainData } from "@/lib/data/loaders";
import type { ProfileMeta } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { FeaturedProjects } from "./FeaturedProjects";
import { HeroSection } from "./HeroSection";
import { HighlightStats } from "./HighlightStats";
import { SkillsSummary } from "./SkillsSummary";

export function HomeClient({
	metaEn,
	metaZh,
}: {
	metaEn: ProfileMeta;
	metaZh: ProfileMeta;
}) {
	const { lang } = useLang();
	const meta = lang === "zh" ? metaZh : metaEn;
	const { scrollYProgress } = useScroll();
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 200,
		damping: 30,
		restDelta: 0.001,
	});

	return (
		<Box>
			<motion.div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					height: 3,
					transformOrigin: "0%",
					scaleX,
					background: "var(--joy-palette-primary-500)",
					zIndex: 50,
				}}
			/>
			<HeroSection meta={meta} />
			<HighlightStats
				years={meta.profile.years_of_experience}
				projects={meta.profile.total_projects}
				domains={domainData.en.length}
			/>
			<SkillsSummary domains={domainData[lang]} />
			<FeaturedProjects />
		</Box>
	);
}
