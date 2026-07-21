"use client";

import Box from "@mui/joy/Box";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageSection";
import type { ProductGroup } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { ProductGroupCard } from "./ProductGroupCard";

const statusOrder = ["Production", "In Progress", "Completed", "Archived"];

const t = {
	en: {
		title: "Products & Experience",
		subtitle:
			"23 product groups shipped across enterprise, healthcare, e-commerce, and fintech",
	},
	zh: {
		title: "產品與工作經歷",
		subtitle: "橫跨企業、醫療、電商與金融科技的 23 個產品群組",
	},
};

const container = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export function ProductListClient({
	groupsEn,
	groupsZh,
}: {
	groupsEn: ProductGroup[];
	groupsZh: ProductGroup[];
}) {
	const { lang } = useLang();
	const tx = t[lang];
	const groups = (lang === "zh" ? groupsZh : groupsEn)
		.slice()
		.sort(
			(a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
		);

	return (
		<Box
			sx={{
				maxWidth: 1000,
				mx: "auto",
				px: { xs: 2, md: 6 },
				pt: { xs: 6, md: 10 },
				pb: { xs: 6, md: 10 },
			}}
		>
			<PageHeader title={tx.title} subtitle={tx.subtitle} />
			<Box
				component={motion.div}
				variants={container}
				initial="hidden"
				animate="show"
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
					gap: 2,
				}}
			>
				{groups.map((group) => (
					<ProductGroupCard key={group.product_name} group={group} />
				))}
			</Box>
		</Box>
	);
}
