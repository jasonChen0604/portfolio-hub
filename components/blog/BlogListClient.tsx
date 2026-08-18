"use client";

import Box from "@mui/joy/Box";
import { motion } from "framer-motion";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageSection";
import type { BlogPostMeta } from "@/lib/blog/posts";
import { BlogPostCard } from "./BlogPostCard";

const container = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const TAGS_COLLAPSED_COUNT = 8;

export function BlogListClient({ posts }: { posts: BlogPostMeta[] }) {
	const [activeTag, setActiveTag] = useState<string | null>(null);
	const [showAllTags, setShowAllTags] = useState(false);

	const tagCounts = new Map<string, number>();
	for (const p of posts) {
		for (const tag of p.tags) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
		}
	}
	const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
	const activeTagHidden =
		activeTag !== null &&
		!sortedTags
			.slice(0, TAGS_COLLAPSED_COUNT)
			.some(([tag]) => tag === activeTag);
	const visibleTags =
		showAllTags || activeTagHidden
			? sortedTags
			: sortedTags.slice(0, TAGS_COLLAPSED_COUNT);

	const filtered = activeTag
		? posts.filter((p) => p.tags.includes(activeTag))
		: posts;

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
				subtitle="Notes and write-ups on what I've built and broken."
			/>
			{sortedTags.length > 0 && (
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						gap: 1,
						mb: 3,
						alignItems: "center",
					}}
				>
					<Box
						component="button"
						onClick={() => setActiveTag(null)}
						sx={{
							fontFamily: "code",
							fontSize: 12,
							fontWeight: 600,
							color:
								activeTag === null ? "primary.contrastText" : "text.secondary",
							bgcolor: activeTag === null ? "primary.500" : "transparent",
							border: "1px solid",
							borderColor: activeTag === null ? "primary.500" : "divider",
							borderRadius: 999,
							px: 1.5,
							py: 0.5,
							cursor: "pointer",
							transition: "border-color 0.2s, color 0.2s, background 0.2s",
							"&:hover": { borderColor: "primary.500" },
						}}
					>
						All
					</Box>
					{visibleTags.map(([tag, count]) => (
						<Box
							key={tag}
							component="button"
							onClick={() => setActiveTag(tag)}
							sx={{
								fontFamily: "code",
								fontSize: 12,
								fontWeight: 600,
								color:
									activeTag === tag ? "primary.contrastText" : "text.secondary",
								bgcolor: activeTag === tag ? "primary.500" : "transparent",
								border: "1px solid",
								borderColor: activeTag === tag ? "primary.500" : "divider",
								borderRadius: 999,
								px: 1.5,
								py: 0.5,
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								transition: "border-color 0.2s, color 0.2s, background 0.2s",
								"&:hover": { borderColor: "primary.500" },
							}}
						>
							{tag}
							<Box
								component="span"
								sx={{
									fontSize: 10,
									opacity: 0.7,
								}}
							>
								{count}
							</Box>
						</Box>
					))}
					{sortedTags.length > TAGS_COLLAPSED_COUNT && (
						<Box
							component="button"
							onClick={() => setShowAllTags((v) => !v)}
							sx={{
								fontFamily: "code",
								fontSize: 12,
								color: "primary.500",
								bgcolor: "transparent",
								border: "none",
								cursor: "pointer",
								px: 0.5,
								py: 0.5,
								"&:hover": { textDecoration: "underline" },
							}}
						>
							{showAllTags
								? "Show less"
								: `+${sortedTags.length - TAGS_COLLAPSED_COUNT} more`}
						</Box>
					)}
				</Box>
			)}
			<Box
				component={motion.div}
				variants={container}
				initial="hidden"
				animate="show"
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
					gap: 2,
				}}
			>
				{filtered.map((post) => (
					<BlogPostCard key={post.slug} post={post} />
				))}
			</Box>
		</Box>
	);
}
