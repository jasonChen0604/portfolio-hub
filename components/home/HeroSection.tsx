"use client";

import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import type { ProfileMeta } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";

const t = {
	en: {
		cta: "View Products",
		ctaContact: "Contact",
	},
	zh: {
		cta: "查看產品",
		ctaContact: "聯絡我",
	},
};

const roleTag = {
	en: (years: number) => `Full-Stack Engineer · ${years}+ yrs`,
	zh: (years: number) => `全端工程師 · ${years}+ 年經驗`,
};

export function HeroSection({ meta }: { meta: ProfileMeta }) {
	const { lang } = useLang();
	const tx = t[lang];
	const [spotlight, setSpotlight] = useState<{ x: number; y: number } | null>(
		null,
	);

	return (
		<Box
			onMouseMove={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				setSpotlight({
					x: ((e.clientX - rect.left) / rect.width) * 100,
					y: ((e.clientY - rect.top) / rect.height) * 100,
				});
			}}
			onMouseLeave={() => setSpotlight(null)}
			sx={{ position: "relative", overflow: "hidden", width: "100%" }}
		>
			<Box
				sx={{
					position: "absolute",
					top: -120,
					right: "5%",
					width: 340,
					height: 340,
					borderRadius: "50%",
					bgcolor: "primary.500",
					opacity: 0.16,
					filter: "blur(70px)",
					pointerEvents: "none",
					"@keyframes drift1": {
						"0%, 100%": { transform: "translate(0,0)" },
						"50%": { transform: "translate(30px,-20px)" },
					},
					animation: "drift1 12s ease-in-out infinite",
				}}
			/>
			<Box
				sx={{
					position: "absolute",
					bottom: -100,
					left: "15%",
					width: 260,
					height: 260,
					borderRadius: "50%",
					bgcolor: "primary.500",
					opacity: 0.1,
					filter: "blur(60px)",
					pointerEvents: "none",
					"@keyframes drift2": {
						"0%, 100%": { transform: "translate(0,0)" },
						"50%": { transform: "translate(-24px,24px)" },
					},
					animation: "drift2 14s ease-in-out infinite",
				}}
			/>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					transition: "opacity 0.3s",
					opacity: spotlight ? 1 : 0,
					background: spotlight
						? `radial-gradient(500px circle at ${spotlight.x}% ${spotlight.y}%, var(--joy-palette-primary-softBg), transparent 60%)`
						: "transparent",
				}}
			/>
			<motion.div
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
			>
				<Box
					sx={{
						position: "relative",
						maxWidth: 960,
						mx: "auto",
						px: { xs: 3, md: 6 },
						py: { xs: 10, md: "140px" },
						pb: { xs: 8, md: "100px" },
					}}
				>
					<Box
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 1,
							fontFamily: "code",
							fontSize: 13,
							color: "primary.500",
							border: "1px solid",
							borderColor: "primary.outlinedBorder",
							px: 1.5,
							py: 0.75,
							borderRadius: 999,
							mb: 3.5,
						}}
					>
						<Box
							sx={{
								width: 6,
								height: 6,
								borderRadius: "50%",
								bgcolor: "primary.500",
								display: "inline-block",
								"@keyframes pulse": {
									"0%": {
										boxShadow: "0 0 0 0 var(--joy-palette-primary-softBg)",
									},
									"100%": { boxShadow: "0 0 0 10px transparent" },
								},
								animation: "pulse 2s ease-out infinite",
							}}
						/>
						{roleTag[lang](meta.profile.years_of_experience)}
					</Box>
					<Typography
						level="h1"
						sx={{
							mb: 2.5,
							fontSize: { xs: "2.75rem", md: "76px" },
							fontWeight: 800,
							lineHeight: 1.02,
							letterSpacing: "-0.03em",
						}}
					>
						{meta.profile.name}
					</Typography>
					<Typography
						level="body-lg"
						sx={{
							mb: 5,
							maxWidth: 620,
							lineHeight: 1.65,
							fontSize: "1.1rem",
							color: "text.secondary",
						}}
					>
						{meta.profile.summary}
					</Typography>
					<Box sx={{ display: "flex", gap: 1.75, flexWrap: "wrap" }}>
						<Button
							component={Link}
							href="/product"
							size="lg"
							sx={{
								fontWeight: 600,
								transition: "transform 0.2s, box-shadow 0.2s",
								"&:hover": {
									transform: "translateY(-2px)",
									boxShadow:
										"0 8px 20px var(--joy-palette-primary-outlinedBorder)",
								},
							}}
						>
							{tx.cta}
						</Button>
						<Button
							component="a"
							href={`mailto:${meta.profile.email}`}
							size="lg"
							variant="outlined"
							color="neutral"
							sx={{
								fontWeight: 600,
								transition: "border-color 0.2s, transform 0.2s",
								"&:hover": {
									transform: "translateY(-2px)",
									borderColor: "primary.500",
								},
							}}
						>
							{tx.ctaContact}
						</Button>
					</Box>
				</Box>
			</motion.div>
		</Box>
	);
}
