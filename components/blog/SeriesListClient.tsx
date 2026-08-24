"use client";

import Box from "@mui/joy/Box";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageSection";
import type { BlogPostMeta } from "@/lib/blog/posts";
import type { SeriesInfo } from "@/lib/blog/series";
import { SeriesCard } from "./SeriesCard";

const container = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export function SeriesListClient({
	seriesList,
	posts,
}: {
	seriesList: SeriesInfo[];
	posts: BlogPostMeta[];
}) {
	return (
		<Box
			sx={{
				maxWidth: 1000,
				mx: "auto",
				px: { xs: 2, md: 6 },
				pt: { xs: 6, md: 10 },
				pb: { xs: 6, md: 10 },
			}}
		>
			<PageHeader
				title="Blog"
				subtitle="Series of write-ups on what I've built and broken."
			/>
			<Box
				component={motion.div}
				variants={container}
				initial="hidden"
				animate="show"
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
					gap: 3,
				}}
			>
				{seriesList.map((series) => (
					<SeriesCard
						key={series.name}
						series={series}
						postCount={
							posts.filter((p) => p.series?.name === series.name).length
						}
					/>
				))}
			</Box>
		</Box>
	);
}
