import type { Metadata } from "next";
import { AboutClient } from "@/components/about/AboutClient";

export const metadata: Metadata = {
	title: "About This Site",
	description:
		"How this portfolio was built: Claude Code skills scrape 115+ project CLAUDE.md files into bilingual JSON, rendered as a Next.js static site with Joy UI.",
};

export default function AboutPage() {
	return <AboutClient />;
}
