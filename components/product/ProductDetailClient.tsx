"use client";

import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Chip from "@mui/joy/Chip";
import Divider from "@mui/joy/Divider";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import { getProject } from "@/lib/data/projects";
import type { ProductGroup } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { ProjectItem } from "./ProjectItem";

const statusColor = {
	Production: "success",
	"In Progress": "warning",
	Completed: "neutral",
	Archived: "neutral",
} as const;

const t = {
	en: { back: "← All Products", projects: "Projects" },
	zh: { back: "← 所有產品", projects: "個專案" },
};

const listVariants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
};

const listItem = {
	hidden: { opacity: 0, x: -16 },
	show: {
		opacity: 1,
		x: 0,
		transition: { type: "spring" as const, stiffness: 280, damping: 22 },
	},
};

export function ProductDetailClient({
	groupEn,
	groupZh,
}: {
	groupEn: ProductGroup;
	groupZh: ProductGroup;
}) {
	const { lang } = useLang();
	const tx = t[lang];
	const group = lang === "zh" ? groupZh : groupEn;

	return (
		<Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 4 }, py: 6 }}>
			<motion.div
				initial={{ opacity: 0, x: -8 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.3 }}
			>
				<Button
					component={Link}
					href="/product"
					variant="plain"
					color="neutral"
					size="sm"
					sx={{ mb: 3 }}
				>
					{tx.back}
				</Button>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, delay: 0.05 }}
			>
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						gap: 1.5,
						mb: 1,
						alignItems: "center",
					}}
				>
					<Chip variant="soft" color={statusColor[group.status] ?? "neutral"}>
						{group.status}
					</Chip>
					{group.roles.map((role) => (
						<Chip key={role} size="sm" variant="outlined" color="neutral">
							{role}
						</Chip>
					))}
					<Typography level="body-sm" color="neutral" sx={{ ml: "auto" }}>
						{group.project_count} {tx.projects}
					</Typography>
				</Box>

				<Typography level="h1" sx={{ mb: 4 }}>
					{group.product_name}
				</Typography>

				<Divider sx={{ mb: 4 }} />
			</motion.div>

			<motion.div
				variants={listVariants}
				initial="hidden"
				animate="show"
				style={{ display: "flex", flexDirection: "column", gap: "16px" }}
			>
				{group.projects.map((pp) => {
					const project = getProject(pp.id, lang);
					if (!project) return null;
					return (
						<motion.div key={pp.id} variants={listItem}>
							<ProjectItem project={project} productProject={pp} />
						</motion.div>
					);
				})}
			</motion.div>
		</Box>
	);
}
