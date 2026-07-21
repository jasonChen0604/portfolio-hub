"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { useEffect, useRef, useState } from "react";
import type { Domain } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import {
	categoryConfigs,
	domainVisualConfigs,
} from "@/lib/skills/hierarchyConfig";
import type { SkillTooltipData } from "@/lib/skills/tooltipLookup";
import { SkillsDomainAccordion } from "./SkillsDomainAccordion";
import { SkillsSearch } from "./SkillsSearch";
import { SkillsSidebarNav } from "./SkillsSidebarNav";
import { SkillsTooltip } from "./SkillsTooltip";

const HEADER_H = 57;

const t = {
	en: {
		title: "Skills & Expertise",
		subtitle: "10 domains · click any to expand",
		searchPlaceholder: "Search skills, categories, or tech…",
		noResults: "No matching results",
	},
	zh: {
		title: "技能與專長",
		subtitle: "10 個技術領域 · 點擊任一項展開",
		searchPlaceholder: "搜尋技能、分類或技術…",
		noResults: "沒有符合的結果",
	},
};

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

	const [query, setQuery] = useState("");
	const [openDomains, setOpenDomains] = useState<Set<string>>(
		new Set([domainVisualConfigs[0].domainId]),
	);
	const [activeDomain, setActiveDomain] = useState(
		domainVisualConfigs[0].domainId,
	);
	const nodesRef = useRef<Record<string, HTMLDivElement | null>>({});
	const [tooltip, setTooltip] = useState<{
		data: SkillTooltipData;
		anchor: Element;
		color: string;
	} | null>(null);

	useEffect(() => {
		const onScroll = () => {
			let active: string | null = null;
			for (const cfg of domainVisualConfigs) {
				const node = nodesRef.current[cfg.domainId];
				if (node && node.getBoundingClientRect().top <= 130)
					active = cfg.domainId;
			}
			if (active) setActiveDomain((prev) => (prev === active ? prev : active));
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const toggleDomain = (domainId: string) => {
		setOpenDomains((prev) => {
			const next = new Set(prev);
			if (next.has(domainId)) next.delete(domainId);
			else next.add(domainId);
			return next;
		});
	};

	const scrollToDomainRef = useRef<
		(domainId: string, behavior?: ScrollBehavior) => void
	>(() => {});
	scrollToDomainRef.current = (domainId, behavior = "smooth") => {
		setOpenDomains((prev) => new Set(prev).add(domainId));
		const node = nodesRef.current[domainId];
		if (!node) return;
		const top =
			node.getBoundingClientRect().top + window.scrollY - HEADER_H - 39;
		window.scrollTo({ top, behavior });
	};
	const scrollToDomain = (domainId: string, behavior?: ScrollBehavior) =>
		scrollToDomainRef.current(domainId, behavior);

	// jump to the target domain when arriving via an incoming #hash (e.g. from the home page)
	useEffect(() => {
		const hash = window.location.hash.slice(1);
		const domainId = hash.startsWith("domain-")
			? hash.slice("domain-".length)
			: null;
		if (!domainId) return;
		requestAnimationFrame(() => scrollToDomainRef.current(domainId, "instant"));
	}, []);

	const searching = query.trim().length > 0;
	const visibleCount = domainVisualConfigs.filter((cfg) => {
		if (!searching) return true;
		const q = query.trim().toLowerCase();
		const label = (lang === "zh" ? cfg.labelZh : cfg.label).toLowerCase();
		if (label.includes(q)) return true;
		const cats = categoryConfigs.filter((c) => c.domainId === cfg.domainId);
		return cats.some((cat) =>
			cat.skills.some((s) => s.toLowerCase().includes(q)),
		);
	}).length;

	return (
		<Box onClick={() => setTooltip(null)}>
			<Box
				sx={{
					maxWidth: 1120,
					mx: "auto",
					px: { xs: 2, md: 6 },
					pt: { xs: 5, md: 8 },
					pb: 3,
				}}
			>
				<Typography
					level="h1"
					sx={{
						fontSize: { xs: 32, md: 44 },
						fontWeight: 800,
						letterSpacing: "-0.02em",
						mb: 1.5,
					}}
				>
					{tx.title}
				</Typography>
				<Typography
					fontFamily="code"
					sx={{ fontSize: 16, color: "text.secondary", mb: 3 }}
				>
					{tx.subtitle}
				</Typography>
				<SkillsSearch
					value={query}
					onChange={setQuery}
					placeholder={tx.searchPlaceholder}
				/>
			</Box>

			<Box
				sx={{
					maxWidth: 1120,
					mx: "auto",
					px: { xs: 2, md: 6 },
					pb: "120px",
					display: "flex",
					gap: 5,
					alignItems: "flex-start",
				}}
			>
				<SkillsSidebarNav
					activeDomain={activeDomain}
					onSelect={scrollToDomain}
				/>

				<Box
					sx={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					{searching && visibleCount === 0 && (
						<Box
							sx={{
								py: 8,
								textAlign: "center",
								color: "text.secondary",
								fontFamily: "code",
								fontSize: 14,
							}}
						>
							{tx.noResults}
						</Box>
					)}
					{domainVisualConfigs.map((cfg) => {
						const categories = categoryConfigs.filter(
							(c) => c.domainId === cfg.domainId,
						);
						const domain = domains.find((d) => d.id === cfg.domainId);
						return (
							<SkillsDomainAccordion
								key={cfg.domainId}
								domainCfg={cfg}
								categories={categories}
								domain={domain}
								isOpen={openDomains.has(cfg.domainId)}
								query={query}
								onToggle={() => toggleDomain(cfg.domainId)}
								domainRef={(node) => {
									nodesRef.current[cfg.domainId] = node;
								}}
								onSkillClick={(data, anchor, color) =>
									setTooltip({ data, anchor, color })
								}
							/>
						);
					})}
				</Box>
			</Box>

			<SkillsTooltip
				data={tooltip?.data ?? null}
				anchor={tooltip?.anchor ?? null}
				color={tooltip?.color}
				onClose={() => setTooltip(null)}
			/>
		</Box>
	);
}
