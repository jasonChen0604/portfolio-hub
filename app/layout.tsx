import InitColorSchemeScript from "@mui/joy/InitColorSchemeScript";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/providers";
import { meta } from "@/lib/data/loaders";

const inter = Inter({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-inter",
});
const jetBrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
	title: {
		default: "Jason Chen — Full-Stack Engineer",
		template: "%s — Jason Chen",
	},
	description: meta.profile.summary,
	openGraph: {
		type: "profile",
		firstName: "Jason",
		lastName: "Chen",
		siteName: "Jason Chen",
		images: ["/og.png"],
	},
	twitter: {
		card: "summary_large_image",
		images: ["/og.png"],
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${inter.variable} ${jetBrainsMono.variable}`}
		>
			<body
				suppressHydrationWarning
				style={{
					margin: 0,
					background: "var(--joy-palette-background-body)",
					color: "var(--joy-palette-text-primary)",
				}}
			>
				<InitColorSchemeScript defaultMode="dark" />
				<Providers>
					<Analytics />
					<Header />
					<main style={{ paddingTop: "57px" }}>{children}</main>
					<Footer />
				</Providers>
			</body>
		</html>
	);
}
