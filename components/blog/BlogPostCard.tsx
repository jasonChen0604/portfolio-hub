"use client";

import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog/posts";

const MotionLink = motion.create(Link);

const item = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, stiffness: 300, damping: 24 },
	},
};

export function BlogPostCard({ post }: { post: BlogPostMeta }) {
	return (
		<Card
			component={MotionLink}
			href={`/blog/${post.slug}`}
			variant="outlined"
			variants={item}
			whileHover={{ y: -4 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			sx={{
				textDecoration: "none",
				display: "flex",
				flexDirection: "column",
				gap: 1,
				bgcolor: "background.surface",
				borderColor: "divider",
				borderRadius: 8,
				p: 2.5,
				transition: "border-color 0.2s",
				"&:hover": { borderColor: "primary.500" },
			}}
		>
			<Typography fontFamily="code" fontSize={12} fontWeight={700} sx={{ color: "text.secondary" }}>
				{new Date(post.publishedAt).toLocaleDateString("en", {
					year: "numeric",
					month: "long",
					day: "numeric",
				})}
			</Typography>
			<Typography sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>
				{post.title}
			</Typography>
			<Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.6 }}>
				{post.excerpt}
			</Typography>
			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
				{post.tags.map((tag) => (
					<Box
						key={tag}
						sx={{
							fontFamily: "code",
							fontSize: 11,
							color: "text.secondary",
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 999,
							px: 1.25,
							py: 0.5,
						}}
					>
						{tag}
					</Box>
				))}
			</Box>
		</Card>
	);
}
