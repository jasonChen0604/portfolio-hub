"use client";

import Box from "@mui/joy/Box";
import Drawer from "@mui/joy/Drawer";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import { useColorScheme } from "@mui/joy/styles";
import Typography from "@mui/joy/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/lib/i18n/context";

const navItems = [
	{ href: "/", en: "Home", zh: "首頁" },
	{ href: "/skills", en: "Skills", zh: "技能" },
	{ href: "/product", en: "Products", zh: "產品" },
	{ href: "/about", en: "About", zh: "關於此站" },
	{ href: "/experience", en: "Experience", zh: "經歷" },
];

function ThemeToggle() {
	const { mode, setMode } = useColorScheme();
	return (
		<IconButton
			variant="outlined"
			color="neutral"
			size="md"
			onClick={() => setMode(mode === "dark" ? "light" : "dark")}
			aria-label="Toggle dark mode"
			sx={{
				borderRadius: 8,
				transition: "border-color 0.2s, transform 0.2s",
				"&:hover": { borderColor: "primary.500", transform: "rotate(-14deg)" },
			}}
		>
			{mode === "dark" ? "☀️" : "🌙"}
		</IconButton>
	);
}

export function Header() {
	const { lang, setLang } = useLang();
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	const isActive = (href: string) =>
		pathname === href || (href !== "/" && pathname.startsWith(href));

	return (
		<Sheet
			component="header"
			variant="plain"
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				px: { xs: 2, md: 6 },
				py: 2.5,
				display: "flex",
				alignItems: "center",
				gap: 2,
				backdropFilter: "blur(10px)",
				bgcolor: "background.surface",
				borderBottom: "1px solid",
				borderColor: "divider",
			}}
		>
			<Link href="/" style={{ textDecoration: "none" }}>
				<Typography
					fontFamily="code"
					fontWeight={700}
					fontSize={20}
					sx={{ color: "text.primary", letterSpacing: "-0.02em" }}
				>
					JC
					<Box component="span" sx={{ color: "primary.500" }}>
						_
					</Box>
				</Typography>
			</Link>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 6,
					ml: "auto",
				}}
			>
				<Box
					component="nav"
					sx={{ display: { xs: "none", md: "flex" }, gap: 5 }}
				>
					{navItems.map((item) => (
						<Typography
							key={item.href}
							component={Link}
							href={item.href}
							fontSize={14}
							fontWeight={500}
							sx={{
								textDecoration: "none",
								color: isActive(item.href) ? "text.primary" : "text.secondary",
								transition: "color 0.2s",
								"&:hover": { color: "text.primary" },
							}}
						>
							{lang === "zh" ? item.zh : item.en}
						</Typography>
					))}
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Box
						component="button"
						onClick={() => setLang(lang === "en" ? "zh" : "en")}
						sx={{
							fontFamily: "code",
							fontSize: 12,
							fontWeight: 600,
							color: "text.secondary",
							bgcolor: "transparent",
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 6,
							px: 1.25,
							py: 0.75,
							cursor: "pointer",
							transition: "border-color 0.2s, color 0.2s",
							"&:hover": { borderColor: "primary.500", color: "primary.500" },
						}}
					>
						{lang === "en" ? "中" : "EN"}
					</Box>
					<ThemeToggle />
					<IconButton
						variant="outlined"
						color="neutral"
						size="md"
						onClick={() => setOpen(true)}
						aria-label="Open menu"
						sx={{ display: { xs: "inline-flex", md: "none" }, borderRadius: 8 }}
					>
						☰
					</IconButton>
				</Box>
			</Box>

			{/* ponytail: render only when open — a closed Joy Drawer keeps its content
			    mounted as position:fixed translated 256px off-screen, which forces a
			    horizontal scrollbar that body overflow-x:hidden can't clip. */}
			{open && (
				<Drawer
					anchor="right"
					open
					onClose={() => setOpen(false)}
					size="sm"
					slotProps={{ content: { sx: { bgcolor: "background.surface" } } }}
				>
					<Box
						component="nav"
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1,
							p: 2,
							pt: 3,
						}}
					>
						{navItems.map((item) => (
							<Typography
								key={item.href}
								component={Link}
								href={item.href}
								onClick={() => setOpen(false)}
								fontSize={18}
								fontWeight={600}
								sx={{
									textDecoration: "none",
									py: 1,
									color: isActive(item.href) ? "primary.500" : "text.primary",
								}}
							>
								{lang === "zh" ? item.zh : item.en}
							</Typography>
						))}
					</Box>
				</Drawer>
			)}
		</Sheet>
	);
}
