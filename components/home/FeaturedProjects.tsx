"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { getFeaturedProjects } from "@/lib/data/projects";
import { useLang } from "@/lib/i18n/context";

const t = {
	en: { title: "Featured Projects" },
	zh: { title: "精選專案" },
};

function TiltCard({ children }: { children: React.ReactNode }) {
	const rotateX = useMotionValue(0);
	const rotateY = useMotionValue(0);
	const springX = useSpring(rotateX, { stiffness: 300, damping: 25 });
	const springY = useSpring(rotateY, { stiffness: 300, damping: 25 });

	return (
		<motion.div
			onMouseMove={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = (e.clientX - rect.left) / rect.width - 0.5;
				const y = (e.clientY - rect.top) / rect.height - 0.5;
				rotateX.set(-y * 7);
				rotateY.set(x * 7);
			}}
			onMouseLeave={() => {
				rotateX.set(0);
				rotateY.set(0);
			}}
			style={{
				rotateX: springX,
				rotateY: springY,
				transformPerspective: 700,
				height: "100%",
			}}
		>
			{children}
		</motion.div>
	);
}

export function FeaturedProjects() {
	const { lang } = useLang();
	const tx = t[lang];
	const featured = getFeaturedProjects(lang);

	return (
		<Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 3, md: 6 }, pb: "120px" }}>
			<Box sx={{ mb: 4 }}>
				<Typography level="h2" sx={{ fontSize: 24, fontWeight: 700 }}>
					{tx.title}
				</Typography>
				<Box
					sx={{
						height: 3,
						width: 48,
						bgcolor: "primary.500",
						borderRadius: 2,
						mt: 1,
					}}
				/>
			</Box>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
					gap: 2.5,
					alignItems: "start",
				}}
			>
				{featured.map((p, i) => (
					<motion.div
						key={p.id}
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{
							duration: 0.7,
							ease: [0.2, 0.8, 0.2, 1],
							delay: i * 0.06,
						}}
					>
						<TiltCard>
							<Box
								sx={{
									height: "100%",
									bgcolor: "background.surface",
									border: "1px solid",
									borderColor: "divider",
									borderRadius: 12,
									p: 3.25,
									transition: "border-color 0.25s, box-shadow 0.25s",
									"&:hover": {
										borderColor: "primary.outlinedBorder",
										boxShadow: "0 16px 32px rgb(0 0 0 / 0.25)",
									},
								}}
							>
								<Typography sx={{ fontSize: 17, fontWeight: 700, mb: 1.25 }}>
									{p.name}
								</Typography>
								<Typography
									sx={{
										fontSize: 14,
										lineHeight: 1.6,
										color: "text.secondary",
										mb: 2.25,
									}}
								>
									{p.description}
								</Typography>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{p.tags.slice(0, 5).map((tag) => (
										<Box
											key={tag}
											sx={{
												fontFamily: "code",
												fontSize: 11,
												color: "primary.500",
												border: "1px solid",
												borderColor: "primary.outlinedBorder",
												px: 1.125,
												py: 0.5,
												borderRadius: 999,
												transition: "background 0.2s, color 0.2s",
												"&:hover": {
													bgcolor: "primary.500",
													color: "primary.contrastText",
												},
											}}
										>
											{tag}
										</Box>
									))}
								</Box>
							</Box>
						</TiltCard>
					</motion.div>
				))}
			</Box>
		</Box>
	);
}
