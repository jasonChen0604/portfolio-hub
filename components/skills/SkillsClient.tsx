"use client";

import Box from "@mui/joy/Box";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Domain } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import {
	categoryConfigs,
	domainVisualConfigs,
} from "@/lib/skills/hierarchyConfig";
import type { SkillTooltipData } from "@/lib/skills/tooltipLookup";
import { SkillsDomainSection } from "./SkillsDomainSection";
import { SkillsTooltip } from "./SkillsTooltip";

const SIDEBAR_W = 220;
const HEADER_H = 57;

const t = {
	en: {
		title: "Skills & Expertise",
		subtitle: "10 domains · click any skill to explore",
	},
	zh: { title: "技能與專業", subtitle: "10 個技術領域 · 點擊技能查看詳情" },
};

// navigate to #hash + smooth scroll
function navTo(id: string) {
	history.pushState(null, "", `#${id}`);
	const el = document.getElementById(id);
	if (!el) return;
	const y = el.getBoundingClientRect().top + window.scrollY - HEADER_H - 48;
	window.scrollTo({ top: y, behavior: "smooth" });
}

export function SkillsClient({
	domainsEn,
	domainsZh,
}: {
	domainsEn: Domain[];
	domainsZh: Domain[];
}) {
	const { lang } = useLang();
	const tx = t[lang];
	const domains = lang === "zh" ? domainsZh : domainsEn;
	const [tooltip, setTooltip] = useState<{
		data: SkillTooltipData;
		anchor: Element;
	} | null>(null);
	const [activeDomain, setActiveDomain] = useState<string>(
		domainVisualConfigs[0].domainId,
	);
	const [activeCategory, setActiveCategory] = useState<string>("");
	const [openDomains, setOpenDomains] = useState<Set<string>>(
		new Set(domainVisualConfigs.map((d) => d.domainId)),
	);
	// ref to avoid stale closure in observer
	const activeRef = useRef({ domain: activeDomain, cat: activeCategory });
	activeRef.current = { domain: activeDomain, cat: activeCategory };

	// ── IntersectionObserver: track which section/category is at top ──
	useEffect(() => {
		const OFFSET = HEADER_H + 80; // px from top of viewport to consider "active"

		// build ordered list of all observable targets
		const targets: Array<{ id: string; domainId: string; catId?: string }> = [];
		for (const cfg of domainVisualConfigs) {
			targets.push({ id: `domain-${cfg.domainId}`, domainId: cfg.domainId });
			for (const cat of categoryConfigs.filter(
				(c) => c.domainId === cfg.domainId,
			)) {
				targets.push({
					id: `cat-${cat.id}`,
					domainId: cfg.domainId,
					catId: cat.id,
				});
			}
		}

		const observer = new IntersectionObserver(
			() => {
				// find the target whose top is closest to OFFSET from viewport top (but above it or at it)
				let best: (typeof targets)[0] | null = null;
				let bestY = -Infinity;

				for (const t of targets) {
					const el = document.getElementById(t.id);
					if (!el) continue;
					const rect = el.getBoundingClientRect();
					// element top is above the threshold line
					if (rect.top <= OFFSET && rect.top > bestY) {
						bestY = rect.top;
						best = t;
					}
				}

				if (best) {
					if (best.domainId !== activeRef.current.domain)
						setActiveDomain(best.domainId);
					const newCat = best.catId ?? "";
					if (newCat !== activeRef.current.cat) setActiveCategory(newCat);
					// auto-expand sidebar for active domain
					setOpenDomains((prev) => {
						if (prev.has(best!.domainId)) return prev;
						const next = new Set(prev);
						next.add(best!.domainId);
						return next;
					});
				}
			},
			{
				rootMargin: `-${OFFSET}px 0px 0px 0px`,
				threshold: 0,
			},
		);

		for (const t of targets) {
			const el = document.getElementById(t.id);
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	}, []); // runs once; targets are stable DOM ids

	// jump to the target section when arriving via an incoming #hash (e.g. from the home page)
	useEffect(() => {
		const id = window.location.hash.slice(1);
		if (id) navTo(id);
	}, []);

	const handleSkillClick = useCallback(
		(data: SkillTooltipData, anchor: Element) => {
			setTooltip({ data, anchor });
		},
		[],
	);

	const toggleDomain = (domainId: string) => {
		setOpenDomains((prev) => {
			const next = new Set(prev);
			if (next.has(domainId)) next.delete(domainId);
			else next.add(domainId);
			return next;
		});
	};

	const handleDomainClick = (domainId: string) => {
		navTo(`domain-${domainId}`);
		if (!openDomains.has(domainId)) toggleDomain(domainId);
	};

	const handleCatClick = (domainId: string, catId: string) => {
		navTo(`cat-${catId}`);
	};

	return (
		<>
			{/* ── Fixed left sidebar ── */}
			<Sheet
				variant="outlined"
				sx={{
					display: { xs: "none", lg: "flex" },
					flexDirection: "column",
					position: "fixed",
					top: HEADER_H,
					left: 0,
					width: SIDEBAR_W,
					height: `calc(100vh - ${HEADER_H}px)`,
					borderTop: "none",
					borderLeft: "none",
					borderBottom: "none",
					borderRadius: 0,
					zIndex: 50,
					overflowY: "auto",
					"&::-webkit-scrollbar": { width: "4px" },
					"&::-webkit-scrollbar-track": { bgcolor: "transparent" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "var(--joy-palette-neutral-outlinedBorder)",
						borderRadius: "4px",
					},
				}}
			>
				<motion.div
					initial={{ opacity: 0, x: -12 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.35 }}
					style={{ flex: 1 }}
				>
					<List
						size="sm"
						sx={{ "--List-gap": "0px", "--ListItem-paddingY": "2px", py: 1 }}
					>
						{domainVisualConfigs.map((cfg) => {
							const rawDomain = domains.find((d) => d.id === cfg.domainId);
							const domLabel = lang === "zh" ? cfg.labelZh : cfg.label;
							const cats = categoryConfigs.filter(
								(c) => c.domainId === cfg.domainId,
							);
							const isOpen = openDomains.has(cfg.domainId);
							const isDomActive = activeDomain === cfg.domainId;

							return (
								<Box key={cfg.domainId}>
									{/* Domain row */}
									<ListItem>
										<ListItemButton
											selected={isDomActive}
											onClick={(e) => {
												e.stopPropagation();
												handleDomainClick(cfg.domainId);
												toggleDomain(cfg.domainId);
											}}
											sx={{
												borderRadius: "sm",
												fontWeight: "lg",
												fontSize: "0.8rem",
												transition: "color 0.15s, background 0.15s",
												color: isDomActive ? cfg.color : "inherit",
												"&.Joy-selected": {
													bgcolor: `color-mix(in srgb, ${cfg.color} 14%, transparent)`,
													color: cfg.color,
												},
											}}
										>
											<span style={{ marginRight: 4 }}>
												{rawDomain?.icon ?? cfg.icon}
											</span>
											{domLabel}
										</ListItemButton>
									</ListItem>

									{/* Category rows */}
									{isOpen &&
										cats.map((cat) => {
											const isCatActive = activeCategory === cat.id;
											return (
												<ListItem key={cat.id} sx={{ pl: 2 }}>
													<ListItemButton
														selected={isCatActive}
														onClick={(e) => {
															e.stopPropagation();
															handleCatClick(cfg.domainId, cat.id);
														}}
														sx={{
															borderRadius: "sm",
															fontSize: "0.72rem",
															py: 0.25,
															transition: "color 0.15s, background 0.15s",
															color: isCatActive ? cfg.color : "neutral.500",
															"&.Joy-selected": {
																bgcolor: `color-mix(in srgb, ${cfg.color} 10%, transparent)`,
																color: cfg.color,
																fontWeight: "lg",
															},
															"&:hover": { color: cfg.color },
															// bullet dot
															"&::before": {
																content: '""',
																display: "inline-block",
																width: isCatActive ? 6 : 4,
																height: isCatActive ? 6 : 4,
																borderRadius: "50%",
																bgcolor: isCatActive
																	? cfg.color
																	: "neutral.400",
																mr: 1,
																transition: "all 0.15s",
																flexShrink: 0,
															},
														}}
													>
														{lang === "zh" ? cat.labelZh : cat.label}
													</ListItemButton>
												</ListItem>
											);
										})}
								</Box>
							);
						})}
					</List>
				</motion.div>
			</Sheet>

			{/* ── Main content ── */}
			<Box
				sx={{
					pl: { xs: 2, lg: `${SIDEBAR_W + 24}px` },
					pr: { xs: 2, md: 4 },
					py: 4,
					maxWidth: { lg: `${SIDEBAR_W + 900}px` },
				}}
				onClick={() => setTooltip(null)}
			>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35 }}
				>
					<Typography level="h1" sx={{ mb: 0.5 }}>
						{tx.title}
					</Typography>
					<Typography level="body-lg" color="neutral" sx={{ mb: 4 }}>
						{tx.subtitle}
					</Typography>
				</motion.div>

				{domainVisualConfigs.map((cfg, i) => {
					const cats = categoryConfigs.filter(
						(c) => c.domainId === cfg.domainId,
					);
					return (
						<SkillsDomainSection
							key={cfg.domainId}
							domainCfg={cfg}
							categories={cats}
							domains={domains}
							onSkillClick={handleSkillClick}
							index={i}
						/>
					);
				})}
			</Box>

			<SkillsTooltip
				data={tooltip?.data ?? null}
				anchor={tooltip?.anchor ?? null}
				onClose={() => setTooltip(null)}
			/>
		</>
	);
}
