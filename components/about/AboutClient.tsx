"use client";

import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import { PageHeader, PageSection } from "@/components/layout/PageSection";
import { useLang } from "@/lib/i18n/context";

const techStack = [
	"Next.js 15",
	"TypeScript",
	"Joy UI (MUI)",
	"Firebase Hosting",
	"Claude Code CLI",
	"pnpm",
];

const t = {
	en: {
		title: "About This Site",
		subtitle:
			"How Jason Chen's portfolio website is built — from raw data to deployed pages.",

		sec1: "Data Collection",
		sec1body:
			"All project data originates from CLAUDE.md files that live inside each of 115+ local project repositories. A custom Claude Code skill (/generate-tech-profile) reads each CLAUDE.md, extracts structured metadata, and outputs bilingual JSON files under tech-profile/. The scan is triggered manually via /scan-projects, which walks ~/project/ and appends new entries to a master projects-list.md index.",

		sec2: "Data Format",
		sec2body: "A flat set of bilingual JSON files under tech-profile/:",
		sec2items: [
			{ file: "meta.json", desc: "profile summary, years, project count" },
			{
				file: "domains-{en|zh}.json",
				desc: "9 skill domains with proficiency levels",
			},
			{
				file: "product-groups-{en|zh}.json",
				desc: "23 product groups with project roles",
			},
			{
				file: "projects/{ID}.json",
				desc: "per-project tags, category, status",
			},
			{
				file: "tag-index-{en|zh}.json",
				desc: "1,976+ unique technology tags",
			},
		],

		sec3: "Presentation",
		sec3body:
			"Next.js 15 static export deployed to Firebase Hosting. All data loads via static JSON at build time — no server or database. Dark/light mode via Joy UI, language via localStorage.",

		sec4: "Tech Stack",
		sec4body: "The tools behind this site.",

		sec5: "SEO & AI Discoverability",
		sec5body:
			"Every page exports metadata and OpenGraph tags. Product pages include JSON-LD so search engines and AI crawlers understand context.",
	},
	zh: {
		title: "關於此站",
		subtitle: "Jason Chen 個人作品集網站的建構方式——從原始資料到上線頁面。",

		sec1: "資料收集方式",
		sec1body:
			"所有專案資料來源於每個本地專案目錄中的 CLAUDE.md 檔案（共 115+ 個）。透過自訂的 Claude Code Skill（/generate-tech-profile），系統會讀取每個 CLAUDE.md 並萃取結構化後設資料，輸出至 tech-profile/ 目錄下的雙語 JSON 檔案。掃描流程由 /scan-projects 手動觸發，遍歷 ~/project/ 目錄並將新項目追加至主索引 projects-list.md。",

		sec2: "資料格式",
		sec2body: "tech-profile/ 目錄下的一組扁平化雙語 JSON 檔案：",
		sec2items: [
			{ file: "meta.json", desc: "個人簡介、年資、專案總數" },
			{ file: "domains-{en|zh}.json", desc: "9 個技術領域與精通程度" },
			{ file: "product-groups-{en|zh}.json", desc: "23 個產品群組與角色" },
			{ file: "projects/{ID}.json", desc: "各專案標籤、類型、狀態" },
			{ file: "tag-index-{en|zh}.json", desc: "1,976+ 個技術標籤索引" },
		],

		sec3: "呈現方式",
		sec3body:
			"Next.js 15 靜態輸出並部署至 Firebase Hosting。所有資料在建置時透過靜態 JSON 載入，無需伺服器或資料庫。深淺色模式由 Joy UI 處理，語言偏好存於 localStorage。",

		sec4: "技術棧",
		sec4body: "此網站背後使用的工具。",

		sec5: "SEO 與 AI 友善",
		sec5body:
			"每個頁面皆匯出 metadata 與 OpenGraph 標籤。產品頁面包含 JSON-LD，讓搜尋引擎與 AI 爬蟲能理解上下文。",
	},
};

export function AboutClient() {
	const { lang } = useLang();
	const tx = t[lang];

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
			<PageHeader title={tx.title} subtitle={tx.subtitle} />

			<PageSection index={1} title={tx.sec1}>
				<Typography
					sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.7 }}
				>
					{tx.sec1body}
				</Typography>
			</PageSection>

			<PageSection index={2} title={tx.sec2}>
				<Typography
					sx={{
						fontSize: 14,
						color: "text.secondary",
						lineHeight: 1.7,
						mb: 1.5,
					}}
				>
					{tx.sec2body}
				</Typography>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
					{tx.sec2items.map((item) => (
						<Box
							key={item.file}
							sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}
						>
							<Typography
								fontFamily="code"
								fontSize={13}
								fontWeight={700}
								sx={{ color: "text.primary" }}
							>
								{item.file}
							</Typography>
							<Typography fontSize={13} sx={{ color: "text.secondary" }}>
								{item.desc}
							</Typography>
						</Box>
					))}
				</Box>
			</PageSection>

			<PageSection index={3} title={tx.sec3}>
				<Typography
					sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.7 }}
				>
					{tx.sec3body}
				</Typography>
			</PageSection>

			<PageSection index={4} title={tx.sec4}>
				<Typography
					sx={{
						fontSize: 14,
						color: "text.secondary",
						lineHeight: 1.7,
						mb: 1.5,
					}}
				>
					{tx.sec4body}
				</Typography>
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
					{techStack.map((tech) => (
						<Box
							key={tech}
							sx={{
								fontFamily: "code",
								fontSize: 13,
								color: "text.secondary",
								bgcolor: "background.surface",
								border: "1px solid",
								borderColor: "divider",
								borderRadius: 999,
								px: 2,
								py: 1,
							}}
						>
							{tech}
						</Box>
					))}
				</Box>
			</PageSection>

			<PageSection index={5} title={tx.sec5} last>
				<Typography
					sx={{
						fontSize: 14,
						color: "text.secondary",
						lineHeight: 1.7,
						mb: 1.5,
					}}
				>
					{tx.sec5body}
				</Typography>
				<Typography
					fontFamily="code"
					fontSize={13}
					sx={{ color: "primary.500" }}
				>
					<Link href="/llms.txt" target="_blank" sx={{ color: "primary.500" }}>
						/llms.txt
					</Link>
					{"  ·  "}
					<Link
						href="/robots.txt"
						target="_blank"
						sx={{ color: "primary.500" }}
					>
						/robots.txt
					</Link>
				</Typography>
			</PageSection>
		</Box>
	);
}
