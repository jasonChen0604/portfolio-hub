"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import { getProject } from "@/lib/data/projects";
import { roleAccent } from "@/lib/data/roleColor";
import type { ProductGroup } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { ProjectItem } from "./ProjectItem";

const statusLabel = {
	Production: "LIVE",
	"In Progress": "WIP",
	Completed: "DONE",
	Archived: "DONE",
} as const;

const t = {
	en: { back: "← All Products", projects: "projects" },
	zh: { back: "← 所有產品", projects: "個專案" },
};

const listVariants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
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
		<Box
			sx={{
				maxWidth: 800,
				mx: "auto",
				px: { xs: 2, md: 6 },
				pt: { xs: 6, md: 10 },
				pb: { xs: 6, md: 10 },
			}}
		>
			<Box
				component={Link}
				href="/product"
				sx={{
					fontFamily: "code",
					fontSize: 13,
					color: "text.secondary",
					textDecoration: "none",
					display: "inline-block",
					mb: 4,
					transition: "color 0.2s",
					"&:hover": { color: "text.primary" },
				}}
			>
				{tx.back}
			</Box>

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35 }}
			>
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						gap: 1,
						mb: 2,
						alignItems: "center",
					}}
				>
					<Typography
						fontFamily="code"
						fontSize={12}
						fontWeight={700}
						sx={{ color: "primary.500" }}
					>
						[{statusLabel[group.status] ?? "DONE"}]
					</Typography>
					{group.roles.map((role) => {
						const accent = roleAccent(role);
						return (
							<Box
								key={role}
								sx={{
									fontFamily: "code",
									fontSize: 11,
									fontWeight: 700,
									color: accent,
									border: "1px solid",
									borderColor: accent,
									borderRadius: 999,
									px: 1.25,
									py: 0.25,
								}}
							>
								{role}
							</Box>
						);
					})}
					<Typography
						fontFamily="code"
						fontSize={12}
						sx={{ color: "text.secondary", ml: "auto" }}
					>
						{group.project_count} {tx.projects}
					</Typography>
				</Box>

				<Typography
					level="h1"
					sx={{
						fontSize: { xs: 32, md: 44 },
						fontWeight: 800,
						letterSpacing: "-0.02em",
						mb: 5,
					}}
				>
					{group.product_name}
				</Typography>
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
