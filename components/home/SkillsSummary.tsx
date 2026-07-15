"use client";

import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import Link from "next/link";
import type { Domain } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { domainVisualConfigs } from "@/lib/skills/hierarchyConfig";

const t = {
	en: { title: "Skills at a Glance", viewAll: "View full skill tree →" },
	zh: { title: "技能一覽", viewAll: "查看完整技能樹 →" },
};

const FALLBACK_COLOR = "#8899a6";

function colorFor(domainId: string): string {
	return (
		domainVisualConfigs.find((c) => c.domainId === domainId)?.color ??
		FALLBACK_COLOR
	);
}

export function SkillsSummary({ domains }: { domains: Domain[] }) {
	const { lang } = useLang();
	const tx = t[lang];

	return (
		<Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, mb: 8 }}>
			<Box
				sx={{
					display: "flex",
					alignItems: "baseline",
					justifyContent: "space-between",
					mb: 3,
				}}
			>
				<Typography level="h2">{tx.title}</Typography>
				<Typography
					component={Link}
					href="/skills"
					level="body-sm"
					color="primary"
					sx={{ textDecoration: "none" }}
				>
					{tx.viewAll}
				</Typography>
			</Box>
			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
				{domains.map((domain) => {
					const color = colorFor(domain.id);
					return (
						<Chip
							key={domain.id}
							component={Link}
							href={`/skills#domain-${domain.id}`}
							size="lg"
							variant="outlined"
							startDecorator={domain.icon}
							sx={{
								borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
								color,
								bgcolor: `color-mix(in srgb, ${color} 10%, transparent)`,
								"&:hover": {
									bgcolor: `color-mix(in srgb, ${color} 18%, transparent)`,
									borderColor: color,
								},
							}}
						>
							{domain.label}
							<Typography
								component="span"
								level="body-xs"
								sx={{
									ml: 0.5,
									color: `color-mix(in srgb, ${color} 70%, var(--joy-palette-text-tertiary))`,
								}}
							>
								({domain.project_count})
							</Typography>
						</Chip>
					);
				})}
			</Box>
		</Box>
	);
}
