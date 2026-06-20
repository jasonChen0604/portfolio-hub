"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Divider from "@mui/joy/Divider";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Link from "@mui/joy/Link";
import { AboutSection } from "./AboutSection";
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
    subtitle: "How Jason Chen's portfolio website is built — from raw data to deployed pages.",

    sec1: "Data Collection",
    sec1body: "All project data originates from CLAUDE.md files that live inside each of 115+ local project repositories. A custom Claude Code skill (/generate-tech-profile) reads each CLAUDE.md, extracts structured metadata, and outputs bilingual JSON files under tech-profile/. The scan is triggered manually via /scan-projects, which walks ~/project/ and appends new entries to a master projects-list.md index.",

    sec2: "Data Format",
    sec2body: "The tech-profile/ directory holds a flat set of JSON files, all bilingual (English + Traditional Chinese):",
    sec2items: [
      "meta.json — profile summary, years of experience, total project count",
      "domains-{en|zh}.json — 9 skill domains with per-skill proficiency levels (expert / proficient / familiar)",
      "product-groups-{en|zh}.json — 23 business product groups, each listing constituent project IDs and roles",
      "projects/{ID}.{en|zh}.json — per-project detail: tags, category, status, description, domain",
      "tag-index-{en|zh}.json — flattened index of 1,976+ unique technology tags for fast lookup",
    ],

    sec3: "Presentation",
    sec3body: "The website is a Next.js 15 static export (output: 'export') deployed to Firebase Hosting. All data is loaded via static JSON imports at build time — no server-side fetch or database. Joy UI's CssVarsProvider handles dark/light mode without JavaScript overhead. Language switching (EN ↔ ZH-TW) uses a lightweight React context backed by localStorage.",

    sec4: "Tech Stack",

    sec5: "SEO & AI Discoverability",
    sec5body: "Every page exports server-rendered metadata (title, description, OpenGraph). Product detail pages include JSON-LD structured data (schema.org/SoftwareApplication) so search engines and AI crawlers can understand each product's context. A /llms.txt file follows the emerging LLM-crawler convention for direct AI agent consumption.",
  },
  zh: {
    title: "關於此站",
    subtitle: "Jason Chen 個人作品集網站的建構方式——從原始資料到上線頁面。",

    sec1: "資料收集方式",
    sec1body: "所有專案資料來源於每個本地專案目錄中的 CLAUDE.md 檔案（共 115+ 個）。透過自訂的 Claude Code Skill（/generate-tech-profile），系統會讀取每個 CLAUDE.md 並萃取結構化後設資料，輸出至 tech-profile/ 目錄下的雙語 JSON 檔案。掃描流程由 /scan-projects 手動觸發，遍歷 ~/project/ 目錄並將新項目追加至主索引 projects-list.md。",

    sec2: "資料格式",
    sec2body: "tech-profile/ 目錄包含一組扁平化 JSON 檔案，全部提供英文與繁體中文版本：",
    sec2items: [
      "meta.json — 個人簡介、年資、專案總數",
      "domains-{en|zh}.json — 9 個技術領域，含各技能精通程度（精通 / 熟練 / 熟悉）",
      "product-groups-{en|zh}.json — 23 個產品群組，各含子專案 ID 與角色",
      "projects/{ID}.{en|zh}.json — 各專案詳情：標籤、類型、狀態、描述、領域",
      "tag-index-{en|zh}.json — 1,976+ 個技術標籤的扁平索引，支援快速查詢",
    ],

    sec3: "呈現方式",
    sec3body: "網站採用 Next.js 15 靜態輸出（output: 'export'）並部署至 Firebase Hosting。所有資料在建置時透過靜態 JSON import 載入，無需伺服器端 fetch 或資料庫。Joy UI 的 CssVarsProvider 以 CSS 變數處理深淺色切換，語言切換（EN ↔ 中文）則使用以 localStorage 為底的輕量 React Context。",

    sec4: "技術棧",

    sec5: "SEO 與 AI 友善",
    sec5body: "每個頁面皆匯出伺服器渲染的 metadata（title、description、OpenGraph）。產品詳細頁包含 JSON-LD 結構化資料（schema.org/SoftwareApplication），讓搜尋引擎與 AI 爬蟲能理解每個產品的上下文。/llms.txt 檔案遵循新興的 LLM 爬蟲慣例，支援 AI Agent 直接讀取。",
  },
};

export function AboutClient() {
  const { lang } = useLang();
  const tx = t[lang];

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, md: 4 }, py: 6 }}>
      <Typography level="h1" sx={{ mb: 1 }}>
        {tx.title}
      </Typography>
      <Typography level="body-lg" color="neutral" sx={{ mb: 5 }}>
        {tx.subtitle}
      </Typography>

      <AboutSection title={tx.sec1}>
        <Typography level="body-md">{tx.sec1body}</Typography>
      </AboutSection>

      <Divider />

      <Box sx={{ mt: 5 }}>
        <AboutSection title={tx.sec2}>
          <Typography level="body-md" sx={{ mb: 2 }}>{tx.sec2body}</Typography>
          <Card variant="soft">
            <CardContent>
              <List size="sm">
                {tx.sec2items.map((item) => (
                  <ListItem key={item}>
                    <Typography level="body-sm" fontFamily="monospace">
                      {item}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </AboutSection>
      </Box>

      <Divider />

      <Box sx={{ mt: 5 }}>
        <AboutSection title={tx.sec3}>
          <Typography level="body-md">{tx.sec3body}</Typography>
        </AboutSection>
      </Box>

      <Divider />

      <Box sx={{ mt: 5, mb: 5 }}>
        <AboutSection title={tx.sec4}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {techStack.map((tech) => (
              <Chip key={tech} variant="soft" color="primary">
                {tech}
              </Chip>
            ))}
          </Box>
        </AboutSection>
      </Box>

      <Divider />

      <Box sx={{ mt: 5 }}>
        <AboutSection title={tx.sec5}>
          <Typography level="body-md" sx={{ mb: 2 }}>{tx.sec5body}</Typography>
          <Typography level="body-sm" color="neutral">
            <Link href="/llms.txt" target="_blank">/llms.txt</Link>
            {" · "}
            <Link href="/robots.txt" target="_blank">/robots.txt</Link>
          </Typography>
        </AboutSection>
      </Box>
    </Box>
  );
}
