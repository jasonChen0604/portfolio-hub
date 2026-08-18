"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog/posts";
import { useLang } from "@/lib/i18n/context";
import { BlogPostCard } from "../blog/BlogPostCard";

const t = {
	en: { title: "Recent Writing", viewAll: "View all posts" },
	zh: { title: "近期文章", viewAll: "查看所有文章" },
};

export function RecentWriting({ posts }: { posts: BlogPostMeta[] }) {
	const { lang } = useLang();
	if (posts.length === 0) return null;

	return (
		<Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 3, md: 6 }, pb: 7 }}>
			<Box
				sx={{
					mb: 4,
					display: "flex",
					alignItems: "flex-end",
					justifyContent: "space-between",
					gap: 2,
				}}
			>
				<Box>
					<Typography level="h2" sx={{ fontSize: 24, fontWeight: 700 }}>
						{t[lang].title}
					</Typography>
					<Box
						sx={{
							height: 3,
							width: 48,
							bgcolor: "primary.500",
							borderRadius: 2,
							mt: 1,
						}}
					/>
				</Box>
				<Typography
					component={Link}
					href="/blog"
					fontFamily="code"
					fontSize={13}
					fontWeight={600}
					sx={{
						color: "primary.500",
						textDecoration: "none",
						whiteSpace: "nowrap",
						"&:hover": { textDecoration: "underline" },
					}}
				>
					{t[lang].viewAll} →
				</Typography>
			</Box>
			<Box
				component={motion.div}
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
					gap: 2,
				}}
			>
				{posts.map((post) => (
					<BlogPostCard key={post.slug} post={post} />
				))}
			</Box>
		</Box>
	);
}
