"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog/posts";
import type { SeriesInfo } from "@/lib/blog/series";

const MotionLink = motion.create(Link);

const container = {
	hidden: {},
	show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const item = {
	hidden: { opacity: 0, y: 16 },
	show: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, stiffness: 300, damping: 24 },
	},
};

export function SeriesDetailClient({
	series,
	posts,
}: {
	series: SeriesInfo;
	posts: BlogPostMeta[];
}) {
	return (
		<Box
			sx={{
				maxWidth: 860,
				mx: "auto",
				px: { xs: 2, md: 6 },
				pt: { xs: 6, md: 10 },
				pb: { xs: 6, md: 10 },
			}}
		>
			<Typography
				component={Link}
				href="/blog"
				fontFamily="code"
				fontSize={13}
				fontWeight={600}
				sx={{
					color: "primary.500",
					textDecoration: "none",
					"&:hover": { textDecoration: "underline" },
				}}
			>
				← All series
			</Typography>
			<Box
				sx={{
					display: "flex",
					gap: 3,
					flexDirection: { xs: "column", md: "row" },
					alignItems: { md: "center" },
					mt: 3,
					mb: 5,
				}}
			>
				<Box
					sx={{
						width: { xs: "100%", md: 220 },
						flexShrink: 0,
						aspectRatio: "16 / 9",
						borderRadius: 8,
						backgroundImage: `url(${series.coverImageUrl})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				/>
				<Box>
					<Typography
						fontFamily="code"
						fontSize={12}
						fontWeight={700}
						sx={{ color: "primary.500", letterSpacing: "0.08em", mb: 1 }}
					>
						{posts.length} {posts.length === 1 ? "PART" : "PARTS"}
					</Typography>
					<Typography
						level="h1"
						sx={{
							fontSize: { xs: 28, md: 36 },
							fontWeight: 800,
							letterSpacing: "-0.02em",
							mb: 1.5,
						}}
					>
						{series.title}
					</Typography>
					<Typography sx={{ fontSize: 15, color: "text.secondary" }}>
						{series.description}
					</Typography>
				</Box>
			</Box>
			<Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 3 }} />
			<Box
				component={motion.div}
				variants={container}
				initial="hidden"
				animate="show"
				sx={{ display: "flex", flexDirection: "column" }}
			>
				{posts.map((post) => (
					<Box
						key={post.slug}
						component={MotionLink}
						href={`/blog/${post.slug}`}
						variants={item}
						sx={{
							display: "flex",
							gap: 2.5,
							alignItems: "center",
							textDecoration: "none",
							color: "inherit",
							py: 2,
							borderBottom: "1px solid",
							borderColor: "divider",
							"&:hover .series-title": { color: "primary.500" },
						}}
					>
						<Typography
							fontFamily="code"
							fontSize={13}
							fontWeight={700}
							sx={{ color: "text.tertiary", width: 28, flexShrink: 0 }}
						>
							{String(post.series?.part ?? "").padStart(2, "0")}
						</Typography>
						{post.coverImageUrl && (
							<Box
								sx={{
									width: 96,
									aspectRatio: "16 / 9",
									flexShrink: 0,
									borderRadius: 6,
									backgroundImage: `url(${post.coverImageUrl})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
						)}
						<Box sx={{ flex: 1 }}>
							<Typography
								className="series-title"
								sx={{
									fontSize: 16,
									fontWeight: 700,
									lineHeight: 1.4,
									transition: "color 0.15s",
								}}
							>
								{post.title}
							</Typography>
							<Typography
								sx={{
									fontSize: 13,
									color: "text.secondary",
									mt: 0.5,
									lineHeight: 1.5,
								}}
							>
								{post.excerpt}
							</Typography>
						</Box>
						<Typography
							fontFamily="code"
							fontSize={12}
							sx={{ color: "text.tertiary", whiteSpace: "nowrap" }}
						>
							{new Date(post.publishedAt).toLocaleDateString("en", {
								month: "short",
								day: "numeric",
							})}
						</Typography>
					</Box>
				))}
			</Box>
		</Box>
	);
}
