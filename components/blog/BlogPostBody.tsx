"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { BlogPost } from "@/lib/blog/posts";

export function BlogPostBody({ post, html }: { post: BlogPost; html: string }) {
	return (
		<Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, md: 6 }, pt: { xs: 6, md: 10 }, pb: { xs: 6, md: 10 } }}>
			<Typography fontFamily="code" fontSize={13} sx={{ color: "text.secondary", mb: 1.5 }}>
				{new Date(post.publishedAt).toLocaleDateString("en", {
					year: "numeric",
					month: "long",
					day: "numeric",
				})}
			</Typography>
			<Typography
				level="h1"
				sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 800, letterSpacing: "-0.02em", mb: 3 }}
			>
				{post.title}
			</Typography>
			{post.tags.length > 0 && (
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 5 }}>
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
			)}
			<Box
				// biome-ignore lint/security/noDangerouslySetInnerHtml: content is authored by Jason Chen, not user input
				dangerouslySetInnerHTML={{ __html: html }}
				sx={{
					fontSize: 16,
					lineHeight: 1.75,
					color: "text.primary",
					"& h2": { fontSize: 24, fontWeight: 700, mt: 5, mb: 2 },
					"& h3": { fontSize: 19, fontWeight: 700, mt: 4, mb: 1.5 },
					"& p": { mb: 2.5 },
					"& ul, & ol": { mb: 2.5, pl: 3 },
					"& li": { mb: 1 },
					"& a": { color: "primary.500" },
					"& code": {
						fontFamily: "code",
						fontSize: 14,
						bgcolor: "background.level1",
						px: 0.75,
						py: 0.25,
						borderRadius: 4,
					},
					"& pre": {
						bgcolor: "background.level1",
						p: 2,
						borderRadius: 8,
						overflowX: "auto",
						mb: 2.5,
					},
					"& pre code": { bgcolor: "transparent", p: 0 },
					"& blockquote": {
						borderLeft: "3px solid",
						borderColor: "divider",
						pl: 2,
						color: "text.secondary",
						mb: 2.5,
					},
					"& img": { maxWidth: "100%", borderRadius: 8 },
				}}
			/>
		</Box>
	);
}
