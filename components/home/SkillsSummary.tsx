"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import type { Domain } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { domainBadge } from "@/lib/skills/hierarchyConfig";

const t = {
	en: { title: "Skills at a Glance", viewAll: "Full skill tree →" },
	zh: { title: "技能總覽", viewAll: "查看完整技能樹 →" },
};

export function SkillsSummary({ domains }: { domains: Domain[] }) {
	const { lang } = useLang();
	const tx = t[lang];
	const listRef = useRef<HTMLDivElement>(null);
	const inView = useInView(listRef, { once: true, margin: "-80px" });
	const maxCount = Math.max(...domains.map((d) => d.project_count), 1);

	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
		>
			<Box
				sx={{ maxWidth: 960, mx: "auto", px: { xs: 3, md: 6 }, pb: "110px" }}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "baseline",
						justifyContent: "space-between",
						mb: 4,
					}}
				>
					<Box>
						<Typography level="h2" sx={{ fontSize: 24, fontWeight: 700 }}>
							{tx.title}
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
						href="/skills"
						fontFamily="code"
						fontSize={13}
						sx={{ textDecoration: "none", color: "primary.500" }}
					>
						{tx.viewAll}
					</Typography>
				</Box>
				<Box ref={listRef} sx={{ display: "flex", flexDirection: "column" }}>
					{domains.map((domain, i) => {
						const pct = Math.round((domain.project_count / maxCount) * 100);
						return (
							<Box
								key={domain.id}
								component={Link}
								href={`/skills#domain-${domain.id}`}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 2.5,
									py: 1.75,
									px: 2,
									mx: -2,
									borderRadius: 8,
									textDecoration: "none",
									color: "text.primary",
									borderBottom: "1px solid",
									borderColor: "divider",
									transition: "background 0.2s, gap 0.2s",
									"&:hover": { bgcolor: "background.surface", gap: 3.25 },
								}}
							>
								<Box
									sx={{
										fontFamily: "code",
										fontSize: 12,
										color: "primary.500",
										width: 48,
										flexShrink: 0,
									}}
								>
									[{domainBadge(domain.id)}]
								</Box>
								<Box
									sx={{
										fontSize: 15,
										fontWeight: 500,
										width: 220,
										flexShrink: 0,
									}}
								>
									{domain.label}
								</Box>
								<Box
									sx={{
										flex: 1,
										height: 6,
										bgcolor: "divider",
										borderRadius: 3,
										overflow: "hidden",
									}}
								>
									<Box
										sx={{
											display: "block",
											height: "100%",
											width: inView ? `${pct}%` : "0%",
											bgcolor: "primary.500",
											borderRadius: 3,
											transition: `width 0.9s cubic-bezier(.2,.8,.2,1) ${i * 60}ms`,
										}}
									/>
								</Box>
								<Box
									sx={{
										fontFamily: "code",
										fontSize: 13,
										color: "text.secondary",
										width: 30,
										textAlign: "right",
										flexShrink: 0,
									}}
								>
									{domain.project_count}
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>
		</motion.div>
	);
}
