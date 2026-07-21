"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/context";
import type { SkillTooltipData } from "@/lib/skills/tooltipLookup";

const t = {
	en: { projects: "projects", more: "more", noProducts: "No linked products" },
	zh: { projects: "個專案", more: "個更多", noProducts: "無連結產品" },
};

const TOOLTIP_W = 260;
const OFFSET = 8;

function calcPos(anchor: Element): { top: number; left: number } {
	const r = anchor.getBoundingClientRect();
	const margin = 8;
	let top = r.bottom + OFFSET;
	const left = Math.max(
		margin,
		Math.min(
			r.left + r.width / 2 - TOOLTIP_W / 2,
			window.innerWidth - TOOLTIP_W - margin,
		),
	);
	if (top + 200 > window.innerHeight) top = r.top - OFFSET - 200;
	return { top, left };
}

export function SkillsTooltip({
	data,
	anchor,
	color,
	onClose,
}: {
	data: SkillTooltipData | null;
	anchor: Element | null;
	color?: string;
	onClose: () => void;
}) {
	const { lang } = useLang();
	const tx = t[lang];
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const accent = color ?? "var(--joy-palette-primary-500)";

	// sync position directly on scroll — bypasses React re-render for zero lag
	useEffect(() => {
		if (!anchor || !nodeRef.current) return;
		const el = nodeRef.current;

		const update = () => {
			const { top, left } = calcPos(anchor);
			el.style.top = `${top}px`;
			el.style.left = `${left}px`;
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, [anchor]);

	const initialPos = anchor ? calcPos(anchor) : { top: 0, left: 0 };

	return (
		<AnimatePresence>
			{data && anchor && (
				<motion.div
					ref={nodeRef}
					key={data.skillTag}
					initial={{ opacity: 0, scale: 0.93, y: -4 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.93, y: -4 }}
					transition={{ duration: 0.15 }}
					style={{
						position: "fixed",
						top: initialPos.top,
						left: initialPos.left,
						width: TOOLTIP_W,
						zIndex: 200,
						background: "var(--joy-palette-background-surface)",
						border: "1px solid var(--joy-palette-divider)",
						borderRadius: 12,
						padding: "14px 16px",
						boxShadow: "0 8px 32px rgb(0 0 0 / 0.3)",
						cursor: "default",
						pointerEvents: "auto",
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* close */}
					<Box
						component="button"
						onClick={onClose}
						aria-label="close"
						type="button"
						sx={{
							position: "absolute",
							top: 6,
							right: 8,
							bgcolor: "transparent",
							border: "none",
							cursor: "pointer",
							fontSize: 16,
							color: "text.secondary",
							lineHeight: 1,
						}}
					>
						×
					</Box>

					{/* header */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							mb: 1.5,
							flexWrap: "wrap",
						}}
					>
						<Typography
							fontFamily="code"
							sx={{ fontSize: 13, fontWeight: 600 }}
						>
							{data.skillTag}
						</Typography>
						{data.level && (
							<Box
								sx={{
									fontFamily: "code",
									fontSize: 10,
									color: accent,
									border: "1px solid",
									borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
									px: 0.75,
									py: 0.25,
									borderRadius: 999,
								}}
							>
								{data.level}
							</Box>
						)}
						<Typography
							fontFamily="code"
							fontSize={11}
							sx={{ ml: "auto", color: "text.secondary", whiteSpace: "nowrap" }}
						>
							{data.projectCount} {tx.projects}
						</Typography>
					</Box>

					{/* product list */}
					<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
						{data.topProducts.length === 0 ? (
							<Typography level="body-sm" sx={{ color: "text.secondary" }}>
								{tx.noProducts}
							</Typography>
						) : (
							<>
								{data.topProducts.map((prod, i) => (
									<motion.div
										key={prod.productSlug}
										initial={{ opacity: 0, x: -6 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: i * 0.05 }}
									>
										<Box
											component={Link}
											href={`/product/${prod.productSlug}`}
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												textDecoration: "none",
												borderRadius: 6,
												px: 0.75,
												py: 0.5,
												"&:hover": { bgcolor: "background.body" },
											}}
										>
											<Typography
												level="body-sm"
												fontWeight="md"
												sx={{ color: "text.primary" }}
											>
												{prod.productName}
											</Typography>
											<Typography
												fontFamily="code"
												fontSize={11}
												sx={{
													ml: 1,
													color: "text.secondary",
													whiteSpace: "nowrap",
												}}
											>
												{prod.projectCount} {tx.projects}
											</Typography>
										</Box>
									</motion.div>
								))}
								{data.extraCount > 0 && (
									<Typography
										fontFamily="code"
										fontSize={11}
										sx={{ color: "text.secondary", pl: 0.75, pt: 0.25 }}
									>
										… {data.extraCount} {tx.more}
									</Typography>
								)}
							</>
						)}
					</Box>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
