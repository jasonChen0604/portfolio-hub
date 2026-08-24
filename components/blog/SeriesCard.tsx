"use client";

import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import type { SeriesInfo } from "@/lib/blog/series";

const MotionLink = motion.create(Link);

const item = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, stiffness: 300, damping: 24 },
	},
};

export function SeriesCard({
	series,
	postCount,
}: {
	series: SeriesInfo;
	postCount: number;
}) {
	return (
		<Card
			component={MotionLink}
			href={`/blog/series/${series.name}`}
			variant="outlined"
			variants={item}
			whileHover={{ y: -6 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			sx={{
				textDecoration: "none",
				p: 0,
				overflow: "hidden",
				bgcolor: "background.surface",
				borderColor: "divider",
				borderRadius: 10,
				transition: "border-color 0.2s",
				"&:hover": { borderColor: "primary.500" },
			}}
		>
			<Box
				sx={{
					aspectRatio: "16 / 9",
					width: "100%",
					backgroundImage: `url(${series.coverImageUrl})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					position: "relative",
				}}
			>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)",
					}}
				/>
				<Typography
					fontFamily="code"
					fontSize={12}
					fontWeight={700}
					sx={{
						position: "absolute",
						top: 12,
						left: 14,
						color: "#fff",
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						textShadow: "0 1px 4px rgba(0,0,0,0.5)",
					}}
				>
					{postCount} {postCount === 1 ? "Post" : "Posts"}
				</Typography>
			</Box>
			<Box sx={{ p: 2.5 }}>
				<Typography sx={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3 }}>
					{series.title}
				</Typography>
				<Typography
					sx={{
						fontSize: 14,
						color: "text.secondary",
						lineHeight: 1.6,
						mt: 1,
					}}
				>
					{series.description}
				</Typography>
			</Box>
		</Card>
	);
}
