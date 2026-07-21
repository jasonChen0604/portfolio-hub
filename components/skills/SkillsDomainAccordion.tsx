"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { useInView } from "framer-motion";
import { useRef } from "react";
import type { Domain } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import type {
	CategoryConfig,
	DomainVisualConfig,
} from "@/lib/skills/hierarchyConfig";
import { domainBadge, languageSkills } from "@/lib/skills/hierarchyConfig";
import {
	resolveSkillTooltip,
	type SkillTooltipData,
} from "@/lib/skills/tooltipLookup";

const t = {
	en: { projects: "projects" },
	zh: { projects: "個專案" },
};

export interface DomainGroup {
	label: string;
	labelZh: string;
	tags: string[];
}

interface Props {
	domainCfg: DomainVisualConfig;
	categories: CategoryConfig[];
	domain: Domain | undefined;
	isOpen: boolean;
	query: string;
	onToggle: () => void;
	domainRef: (node: HTMLDivElement | null) => void;
	onSkillClick: (
		data: SkillTooltipData,
		anchor: Element,
		color: string,
	) => void;
}

function matchesQuery(text: string, q: string) {
	return text.toLowerCase().includes(q);
}

export function SkillsDomainAccordion({
	domainCfg,
	categories,
	domain,
	isOpen,
	query,
	onToggle,
	domainRef,
	onSkillClick,
}: Props) {
	const { lang } = useLang();
	const tx = t[lang];
	const label = lang === "zh" ? domainCfg.labelZh : domainCfg.label;
	const badge = domainBadge(domainCfg.domainId);
	const color = domainCfg.color;
	const summary =
		domain?.summary ??
		(lang === "zh" ? domainCfg.summaryZh : domainCfg.summaryEn) ??
		"";
	const skillMap = new Map(
		(domain?.skills ?? []).map((s) => [s.tag.toLowerCase(), s]),
	);

	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, { once: true, margin: "-40px" });

	const rawGroups: DomainGroup[] =
		domainCfg.domainId === "languages"
			? [{ label: "Languages", labelZh: "語言", tags: languageSkills }]
			: categories.map((cat) => ({
					label: cat.label,
					labelZh: cat.labelZh,
					tags: [...new Set(cat.skills)],
				}));

	const q = query.trim().toLowerCase();
	const searching = q.length > 0;

	let groups = rawGroups;
	let matched = true;
	if (searching) {
		const domainMatch = matchesQuery(label, q) || matchesQuery(badge, q);
		groups = rawGroups
			.map((g) => {
				const groupLabel = lang === "zh" ? g.labelZh : g.label;
				const labelMatch = matchesQuery(groupLabel, q);
				const tagMatches = g.tags.filter((tag) => matchesQuery(tag, q));
				if (domainMatch || labelMatch) return g;
				if (tagMatches.length) return { ...g, tags: tagMatches };
				return null;
			})
			.filter((g): g is DomainGroup => g !== null);
		matched = domainMatch || groups.length > 0;
	}

	const open = searching ? matched : isOpen;

	if (searching && !matched) return null;

	return (
		<Box
			id={`domain-${domainCfg.domainId}`}
			ref={(node: HTMLDivElement | null) => {
				ref.current = node;
				domainRef(node);
			}}
			sx={{
				bgcolor: "background.surface",
				scrollMarginTop: 96,
				border: "1px solid",
				borderColor: "divider",
				borderRadius: 12,
				overflow: "hidden",
				opacity: inView ? 1 : 0,
				transform: inView ? "translateY(0)" : "translateY(16px)",
				transition: "opacity 0.6s ease, transform 0.6s ease",
			}}
		>
			<Box
				onClick={onToggle}
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 2,
					px: 3,
					py: 2.75,
					cursor: "pointer",
				}}
			>
				<Box
					sx={{
						fontFamily: "code",
						fontSize: 12,
						color,
						border: "1px solid",
						borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
						px: 1,
						py: 0.5,
						borderRadius: 6,
						flexShrink: 0,
					}}
				>
					[{badge}]
				</Box>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
						<Typography sx={{ fontSize: 18, fontWeight: 700 }}>
							{label}
						</Typography>
						{domain && (
							<Typography
								fontFamily="code"
								fontSize={12}
								sx={{ color: "text.secondary" }}
							>
								{domain.project_count} {tx.projects}
							</Typography>
						)}
					</Box>
					{summary && (
						<Typography
							sx={{
								fontSize: 14,
								color: "text.secondary",
								mt: 0.75,
								lineHeight: 1.5,
							}}
						>
							{summary}
						</Typography>
					)}
				</Box>
				<Box
					component="span"
					sx={{
						fontFamily: "code",
						color: "text.secondary",
						flexShrink: 0,
						transition: "transform 0.3s",
						transform: open ? "rotate(180deg)" : "rotate(0deg)",
					}}
				>
					↓
				</Box>
			</Box>
			<Box
				sx={{
					display: "grid",
					gridTemplateRows: open ? "1fr" : "0fr",
					transition: "grid-template-rows 0.35s ease",
				}}
			>
				<Box sx={{ overflow: "hidden" }}>
					<Box
						sx={{
							px: 3,
							pb: 3,
							pt: 2.25,
							mt: 0.25,
							borderTop: "1px solid",
							borderColor: "divider",
							display: "flex",
							flexDirection: "column",
							gap: 2,
						}}
					>
						{groups.map((g) => (
							<Box key={g.label}>
								<Typography
									fontFamily="code"
									fontSize={12}
									sx={{ color: "text.secondary", mb: 1 }}
								>
									{lang === "zh" ? g.labelZh : g.label}
								</Typography>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{g.tags.map((tag) => {
										const skill = skillMap.get(tag.toLowerCase());
										return (
											<Box
												key={tag}
												component={skill ? "button" : "span"}
												type={skill ? "button" : undefined}
												onClick={
													skill
														? (e: React.MouseEvent<HTMLElement>) => {
																e.stopPropagation();
																onSkillClick(
																	resolveSkillTooltip(
																		tag,
																		skill.projects ?? [],
																		skill.project_count,
																		skill.level,
																		lang,
																	),
																	e.currentTarget,
																	color,
																);
															}
														: undefined
												}
												sx={{
													fontFamily: "code",
													fontSize: 12,
													color,
													bgcolor: "transparent",
													border: "1px solid",
													borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
													px: 1.25,
													py: 0.625,
													borderRadius: 999,
													cursor: skill ? "pointer" : "default",
													transition: "background 0.2s, color 0.2s",
													"&:hover": {
														bgcolor: color,
														color: "background.body",
													},
												}}
											>
												{tag}
											</Box>
										);
									})}
								</Box>
							</Box>
						))}
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
