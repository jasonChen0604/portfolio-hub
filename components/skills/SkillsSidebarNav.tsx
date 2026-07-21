"use client";

import Box from "@mui/joy/Box";
import { useLang } from "@/lib/i18n/context";
import { domainVisualConfigs } from "@/lib/skills/hierarchyConfig";

interface Props {
	activeDomain: string;
	onSelect: (domainId: string) => void;
}

export function SkillsSidebarNav({ activeDomain, onSelect }: Props) {
	const { lang } = useLang();

	return (
		<Box
			component="aside"
			sx={{
				display: { xs: "none", lg: "flex" },
				position: "sticky",
				top: 88,
				width: 196,
				flexShrink: 0,
				flexDirection: "column",
				gap: 0.25,
			}}
		>
			{domainVisualConfigs.map((cfg) => {
				const active = activeDomain === cfg.domainId;
				const label = lang === "zh" ? cfg.labelZh : cfg.label;
				return (
					<Box
						key={cfg.domainId}
						component="button"
						onClick={() => onSelect(cfg.domainId)}
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.25,
							px: 1.25,
							py: 1.125,
							border: "none",
							borderRadius: 8,
							bgcolor: active
								? `color-mix(in srgb, ${cfg.color} 16%, transparent)`
								: "transparent",
							color: active ? "text.primary" : "text.secondary",
							cursor: "pointer",
							textAlign: "left",
							fontSize: 13,
							fontWeight: 500,
							transition: "background 0.2s, color 0.2s",
							"&:hover": { color: "text.primary" },
						}}
					>
						<Box
							component="span"
							sx={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								bgcolor: cfg.color,
								flexShrink: 0,
							}}
						/>
						{label}
					</Box>
				);
			})}
		</Box>
	);
}
