"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { ReactNode } from "react";

export const SECTION_INDENT = 44;

export function PageHeader({
	title,
	subtitle,
}: {
	title: string;
	subtitle: string;
}) {
	return (
		<>
			<Typography
				level="h1"
				sx={{
					fontSize: { xs: 32, md: 44 },
					fontWeight: 800,
					letterSpacing: "-0.02em",
					mb: 1.5,
				}}
			>
				{title}
			</Typography>
			<Typography
				fontFamily="code"
				sx={{ fontSize: 16, color: "text.secondary", mb: 4 }}
			>
				{subtitle}
			</Typography>
			<Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 5 }} />
		</>
	);
}

export function SectionHeading({
	index,
	title,
}: {
	index: number;
	title: string;
}) {
	return (
		<Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 3 }}>
			<Typography
				fontFamily="code"
				fontSize={13}
				fontWeight={700}
				sx={{ color: "primary.500", width: SECTION_INDENT - 24, flexShrink: 0 }}
			>
				{String(index).padStart(2, "0")}
			</Typography>
			<Typography level="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
				{title}
			</Typography>
		</Box>
	);
}

export function PageSection({
	index,
	title,
	children,
	last = false,
}: {
	index: number;
	title: string;
	children: ReactNode;
	last?: boolean;
}) {
	return (
		<Box
			sx={
				last
					? { mb: 0 }
					: { mb: 6, pb: 6, borderBottom: "1px solid", borderColor: "divider" }
			}
		>
			<SectionHeading index={index} title={title} />
			<Box sx={{ pl: `${SECTION_INDENT}px` }}>{children}</Box>
		</Box>
	);
}
