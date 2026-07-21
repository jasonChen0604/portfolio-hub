"use client";

import Box from "@mui/joy/Box";
import { animate, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/context";

function CountUp({ value }: { value: number }) {
	const [display, setDisplay] = useState(0);

	useEffect(() => {
		const controls = animate(0, value, {
			duration: 1.3,
			ease: [0.2, 0.8, 0.2, 1],
			onUpdate: (v) => setDisplay(Math.round(v)),
		});
		return () => controls.stop();
	}, [value]);

	return <span>{display}</span>;
}

const stats = (years: number, projects: number, domains: number) => [
	{ value: years, suffix: "+", sub: { en: "Years Experience", zh: "年經驗" } },
	{
		value: projects,
		suffix: "",
		sub: { en: "Projects Shipped", zh: "完成專案" },
	},
	{ value: domains, suffix: "", sub: { en: "Tech Domains", zh: "技術領域" } },
];

export function HighlightStats({
	years,
	projects,
	domains,
}: {
	years: number;
	projects: number;
	domains: number;
}) {
	const { lang } = useLang();
	const items = stats(years, projects, domains);

	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
		>
			<Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 3, md: 6 }, pb: 7 }}>
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
						gap: "1px",
						bgcolor: "divider",
						border: "1px solid",
						borderColor: "divider",
						borderRadius: 12,
						overflow: "hidden",
					}}
				>
					{items.map((item) => (
						<Box
							key={item.sub.en}
							sx={{
								bgcolor: "background.body",
								p: 3.5,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								transition: "background 0.25s",
								"&:hover": { bgcolor: "background.surface" },
							}}
						>
							<Box
								sx={{
									fontFamily: "code",
									fontSize: 40,
									fontWeight: 700,
									letterSpacing: "-0.02em",
								}}
							>
								<CountUp value={item.value} />
								{item.suffix}
							</Box>
							<Box sx={{ fontSize: 14, color: "text.secondary", mt: 0.75 }}>
								{lang === "zh" ? item.sub.zh : item.sub.en}
							</Box>
						</Box>
					))}
				</Box>
			</Box>
		</motion.div>
	);
}
