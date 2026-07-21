"use client";

import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import { productNameToSlug } from "@/lib/data/loaders";
import type { ProductGroup } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";

const MotionLink = motion.create(Link);

const statusLabel = {
	Production: "LIVE",
	"In Progress": "WIP",
	Completed: "DONE",
	Archived: "DONE",
} as const;

const item = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, stiffness: 300, damping: 24 },
	},
};

export function ProductGroupCard({ group }: { group: ProductGroup }) {
	const { lang } = useLang();
	const slug = productNameToSlug(group.product_name);

	return (
		<Card
			component={MotionLink}
			href={`/product/${slug}`}
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
			<Typography fontFamily="code" fontSize={12} fontWeight={700}>
				<Box component="span" sx={{ color: "primary.500" }}>
					[{statusLabel[group.status] ?? "DONE"}]
				</Box>{" "}
				<Box component="span" sx={{ color: "text.secondary" }}>
					{group.project_count} {lang === "zh" ? "個專案" : "projects"}
				</Box>
			</Typography>
			<Typography sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>
				{group.product_name}
			</Typography>
			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
				{group.roles.map((role) => (
					<Box
						key={role}
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
						{role}
					</Box>
				))}
			</Box>
		</Card>
	);
}
