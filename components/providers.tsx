"use client";

import { CssVarsProvider, extendTheme } from "@mui/joy/styles";
import { LangProvider } from "@/lib/i18n/context";

const theme = extendTheme({
	fontFamily: {
		body: "var(--font-inter), sans-serif",
		display: "var(--font-inter), sans-serif",
		code: "var(--font-jetbrains-mono), monospace",
	},
	colorSchemes: {
		light: {
			palette: {
				primary: {
					50: "#eef1ff",
					100: "#dde3ff",
					200: "#b9c6ff",
					300: "#8fa3ff",
					400: "#6a84fa",
					500: "#4c6ef0",
					600: "#3d5adf",
					700: "#3349c4",
					800: "#2c3ea3",
					900: "#263687",
					softBg: "oklch(52% 0.15 255 / 0.1)",
					outlinedBorder: "oklch(52% 0.15 255 / 0.3)",
				},
				background: {
					body: "oklch(98% 0.004 260)",
					surface: "oklch(100% 0 0)",
				},
				text: {
					primary: "oklch(22% 0.012 260)",
					secondary: "oklch(48% 0.012 260)",
				},
				divider: "oklch(88% 0.008 260)",
			},
		},
		dark: {
			palette: {
				primary: {
					50: "#eef1ff",
					100: "#dde3ff",
					200: "#b9c6ff",
					300: "#8fa3ff",
					400: "#7d9bff",
					500: "#6f92fa",
					600: "#5c7cfa",
					700: "#4c6ef0",
					800: "#3d5adf",
					900: "#3349c4",
					softBg: "oklch(72% 0.15 255 / 0.12)",
					outlinedBorder: "oklch(72% 0.15 255 / 0.35)",
				},
				background: {
					body: "oklch(16% 0.01 260)",
					surface: "oklch(20% 0.012 260)",
				},
				text: {
					primary: "oklch(96% 0.004 260)",
					secondary: "oklch(65% 0.012 260)",
				},
				divider: "oklch(30% 0.012 260)",
			},
		},
	},
});

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<CssVarsProvider theme={theme} defaultMode="dark">
			<LangProvider>{children}</LangProvider>
		</CssVarsProvider>
	);
}
