# Personal Home Page — Portfolio Automation Kit

> 自動化作品集管理工具，透過 Claude Code Skills 為所有專案生成標準化 CLAUDE.md  
> Automated portfolio management kit using Claude Code Skills to generate standardized CLAUDE.md across all projects.

🔗 **Live Demo:** [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)
📝 **專案介紹 / Write-up:** [I fed my tech profile into a homepage generator so I'd never have to write about my projects again](https://medium.com/@jason-chen-0604/i-fed-my-tech-profile-into-a-homepage-generator-so-id-never-have-to-write-about-my-projects-f16b1df47899?sharedUserId=jason-chen-0604)

---

## 目錄 / Table of Contents

- [中文說明](#中文說明)
- [English Guide](#english-guide)

---

## 中文說明

> 📦 這套 Skill 已獨立為專案 **[codebase-to-portfolio](https://github.com/jasonChen0604/codebase-to-portfolio)**，建議優先參考該 repo 取得最新版本與安裝方式。

### 這是什麼？

這個 repo 是個人作品集的**管理中心**，包含：

- `projects-list.md` — 追蹤本機所有軟體專案的狀態索引
- `global-skills/` — 可安裝到 Claude Code 的 CLAUDE.md 生成 Skill（中/英文版）
- `.claude/skills/` — 批次生成、掃描、版本管理等輔助 Skill（**在此 repo 目錄下即可直接使用，無需複製**）

### 快速開始

#### Step 1：選擇語言，複製 Skill 到 Claude Code

`/init-claude-md` 是唯一需要安裝到全域的 Skill。根據你想要 CLAUDE.md 輸出的語言，複製對應資料夾：

**繁體中文版：**
```bash
cp -r global-skills/init-claude-md-zh ~/.claude/skills/init-claude-md
```

**英文版：**
```bash
cp -r global-skills/init-claude-md-en ~/.claude/skills/init-claude-md
```

> ⚠️ 目標資料夾名稱必須是 `init-claude-md`，Claude Code 會以此為 `/init-claude-md` 指令名稱。

#### Step 2：確認安裝

開啟任意專案，在 Claude Code 中輸入：

```
/init-claude-md
```

Claude 會自動分析當前目錄並生成 `CLAUDE.md`。

---

### Skill 說明

輔助 Skill（`/scan-projects`、`/batch-init-claude-md`、`/get-latest-version`）放在此 repo 的 `.claude/skills/` 下，在這個目錄開啟 Claude Code 即可直接執行，不需要安裝到 `~/.claude/skills/`。

| Skill | 指令 | 執行位置 | 功能 |
|-------|------|---------|------|
| `init-claude-md` | `/init-claude-md` | 任意專案目錄 | 分析當前專案，生成標準化 `CLAUDE.md` |
| `scan-projects` | `/scan-projects` | 此 repo 目錄 | 掃描專案目錄下所有專案，輸出 `projects-list.md`（預設 `~/project`，可修改） |
| `batch-init-claude-md` | `/batch-init-claude-md` | 此 repo 目錄 | 批次為多個專案生成 CLAUDE.md（每批最多 3 個並行） |
| `get-latest-version` | `/get-latest-version` | 此 repo 目錄 | 從 `projects-list.md` 取得目前最新的 skill_version |
| `generate-tech-profile` | `/generate-tech-profile` | 此 repo 目錄 | 從所有最新版 CLAUDE.md 彙整個人技術樹，同時輸出 `tech-profile-en.md`（英文版）與 `tech-profile-zh.md`（繁體中文版） |
| `generate-tech-profile-json` | `/generate-tech-profile-json` | 此 repo 目錄 | 從所有最新版 CLAUDE.md 彙整個人技術樹，同時輸出 `tech-profile-en.json`（英文版）與 `tech-profile-zh.json`（繁體中文版），適合個人網站 API 消費與 LinkedIn 更新 |

---

### 使用流程

```
1. 複製 init-claude-md → ~/.claude/skills/（只需做一次）
2. 在任意專案目錄執行 /init-claude-md
3. 回到此 repo，執行 /scan-projects 更新索引
4. 在 projects-list.md 將不想處理的專案 Active 欄位改為 ❌
5. 執行 /batch-init-claude-md 批次補齊未初始化的專案
6. 執行 /generate-tech-profile 產出個人技術樹（tech-profile-en.md / tech-profile-zh.md）
7. （可選）執行 /generate-tech-profile-json 產出 JSON 格式技術樹（tech-profile-en.json / tech-profile-zh.json）
```

> 💡 `/batch-init-claude-md` 只會處理 Active 為 ✅ 且尚未有 CLAUDE.md（或版本過舊）的專案，因此**建議先整理 `projects-list.md` 再批次執行**，避免對不需要的專案進行生成。

> 💡 `/generate-tech-profile` 只讀取版本號等於當前最新版的專案，確保資料品質一致。每次執行都會同時覆寫 `tech-profile-en.md` 與 `tech-profile-zh.md`，可在 `/batch-init-claude-md` 完成後隨時重新生成。

> 💡 `/generate-tech-profile-json` 輸出結構化 JSON，適合直接作為個人網站的 API 資料來源或 LinkedIn 履歷更新的資料格式。

---

### 自訂設定

每個 Skill 包含 `config.json`，可修改允許的分類與狀態：

```json
{
  "allowed_categories": [
    "Frontend Web Development",
    "Backend API / Microservices",
    "Full-Stack Web Application",
    ...
  ],
  "allowed_statuses": ["Production", "Completed", "In Progress", "Archived"]
}
```

修改後，所有後續生成的 CLAUDE.md 都會套用新設定。

#### 修改掃描目錄

`/scan-projects` 預設掃描 `~/project`，若你的專案放在其他位置，可以直接修改 `.claude/skills/scan-projects/SKILL.md` 中的 `BASE_DIR`：

```bash
BASE_DIR="$HOME/your-projects-folder"
```

---

### 套用 Claude Design 視覺重新設計

這個網站的首頁與全站樣式（深色 oklch 配色、JetBrains Mono / Inter 字體、卡片式排版）是先在 [Claude Design](https://claude.ai/design) 完成設計，再由 Claude Code 依照設計稿重新實作成 Next.js + MUI Joy 元件。實際採用的流程如下：

1. **在專案根目錄放入從 Claude Design 匯出的 HTML**
   從 Claude Design 專案匯出 bundled HTML（例如 `claude-design.html`），放在專案根目錄。這份檔案是自我解壓縮的靜態頁面，可直接在瀏覽器開啟預覽，也可作為後續 prompt 的參考依據。此檔案已加入 `.gitignore`，不會被提交。

2. **用 Playwright MCP 造訪 Claude Design 的 public demo URL**
   若已有 Claude Design 專案發布的分享連結（`https://claude.ai/design/p/<project-id>` 或 artifact 連結），直接請 Claude Code 用 Playwright MCP（`browser_navigate` + `browser_take_screenshot`）開啟並截圖，藉此取得目前設計稿的實際渲染結果（而非只讀原始碼），確保完全比對到最新視覺效果。

3. **在 prompt 中明確要求「完全重新參考設計網頁」**
   下指令時明確說明「不要保留原先設計，完全套用 Claude Design 的視覺系統」，讓 Claude Code 知道這是整體視覺重構，而不是在既有元件上做局部調整。範例 prompt：
   > 完全套用 claude design 設計的 UI，不要保留原先的設計

   Claude Code 會依此讀取設計稿的配色 token、字體、排版結構，並對照專案既有的資料層（`lib/data/`）與元件慣例（MUI Joy `sx` prop），重新實作對應元件，而不是照抄設計稿的 HTML/CSS。

> 💡 建議在套用大範圍視覺變更後，用 Playwright MCP 對正式頁面（`localhost` 或部署網址）截圖比對，確認深色/淺色模式、雙語切換都正常運作後再提交。

---

## English Guide

> 📦 This Skill set has been spun off into its own project, **[codebase-to-portfolio](https://github.com/jasonChen0604/codebase-to-portfolio)** — refer there first for the latest version and setup instructions.

### What is this?

This repo is a **portfolio management center** containing:

- `projects-list.md` — an index tracking the status of all local software projects
- `global-skills/` — installable Claude Code Skills for generating CLAUDE.md (Chinese & English versions)
- `.claude/skills/` — helper Skills for batch generation, scanning, and version management (**run directly from this repo — no installation needed**)

### Quick Start

#### Step 1: Choose your language, copy the Skill to Claude Code

`/init-claude-md` is the only Skill that needs to be installed globally. Copy the folder matching your preferred output language:

**Traditional Chinese output:**
```bash
cp -r global-skills/init-claude-md-zh ~/.claude/skills/init-claude-md
```

**English output:**
```bash
cp -r global-skills/init-claude-md-en ~/.claude/skills/init-claude-md
```

> ⚠️ The destination folder **must** be named `init-claude-md` — Claude Code uses the folder name as the slash command.

#### Step 2: Verify installation

Open any project and type in Claude Code:

```
/init-claude-md
```

Claude will analyze the current directory and generate a `CLAUDE.md` file automatically.

---

### Skills Reference

The helper Skills (`/scan-projects`, `/batch-init-claude-md`, `/get-latest-version`) live in this repo's `.claude/skills/` folder. Open Claude Code from this repo directory and they're ready to use — no need to copy them to `~/.claude/skills/`.

| Skill | Command | Run from | Description |
|-------|---------|----------|-------------|
| `init-claude-md` | `/init-claude-md` | Any project directory | Analyze the current project and generate a standardized `CLAUDE.md` |
| `scan-projects` | `/scan-projects` | This repo | Scan projects directory and output `projects-list.md` (default `~/project`, configurable) |
| `batch-init-claude-md` | `/batch-init-claude-md` | This repo | Batch-generate CLAUDE.md for multiple projects (up to 3 in parallel per batch) |
| `get-latest-version` | `/get-latest-version` | This repo | Read the latest `skill_version` from `projects-list.md` |
| `generate-tech-profile` | `/generate-tech-profile` | This repo | Aggregate all latest-version CLAUDE.md files into two output files: `tech-profile-en.md` (English) and `tech-profile-zh.md` (Traditional Chinese) — a tech tree and project mapping for use as a personal website data source |
| `generate-tech-profile-json` | `/generate-tech-profile-json` | This repo | Aggregate all latest-version CLAUDE.md files into two JSON output files: `tech-profile-en.json` (English) and `tech-profile-zh.json` (Traditional Chinese) — suitable for personal website API consumption and LinkedIn profile updates |

---

### Workflow

```
1. Copy init-claude-md → ~/.claude/skills/ (one-time setup)
2. Run /init-claude-md in any project directory
3. Return to this repo, run /scan-projects to refresh the index
4. In projects-list.md, set the Active column to ❌ for any projects you want to skip
5. Run /batch-init-claude-md to batch-fill projects that are missing CLAUDE.md
6. Run /generate-tech-profile to produce tech-profile-en.md and tech-profile-zh.md (personal website data source)
7. (Optional) Run /generate-tech-profile-json to produce tech-profile-en.json and tech-profile-zh.json
```

> 💡 `/batch-init-claude-md` only processes projects where Active is ✅ and CLAUDE.md is missing or outdated. **It's recommended to review `projects-list.md` and exclude unwanted projects before running the batch**, to avoid generating files for projects you don't need.

> 💡 `/generate-tech-profile` only reads projects whose version matches the current latest, ensuring consistent data quality. Re-run it anytime after `/batch-init-claude-md` completes — it always overwrites both `tech-profile-en.md` and `tech-profile-zh.md`.

> 💡 `/generate-tech-profile-json` outputs structured JSON suitable for direct use as a personal website API data source or for updating your LinkedIn profile.

---

### Customization

Each Skill contains a `config.json` where you can modify allowed categories and statuses:

```json
{
  "allowed_categories": [
    "Frontend Web Development",
    "Backend API / Microservices",
    "Full-Stack Web Application",
    ...
  ],
  "allowed_statuses": ["Production", "Completed", "In Progress", "Archived"]
}
```

All subsequent CLAUDE.md files generated will use the updated values.

#### Changing the scan directory

`/scan-projects` defaults to scanning `~/project`. To change it, edit `BASE_DIR` in `.claude/skills/scan-projects/SKILL.md`:

```bash
BASE_DIR="$HOME/your-projects-folder"
```

---

### Applying a Claude Design visual redesign

The site's home page and shared chrome (dark oklch palette, JetBrains Mono / Inter typography, card-driven layout) were first designed in [Claude Design](https://claude.ai/design), then reimplemented as Next.js + MUI Joy components by Claude Code. The workflow used:

1. **Drop the exported HTML into the project root**
   Export the bundled HTML from the Claude Design project (e.g. `claude-design.html`) and place it at the repo root. This is a self-unpacking static page you can open directly in a browser to preview, and it doubles as reference material for prompting. This file is gitignored and never committed.

2. **Use Playwright MCP to visit the Claude Design public demo URL**
   If a Claude Design project share link is available (`https://claude.ai/design/p/<project-id>` or an artifact link), have Claude Code open it with Playwright MCP (`browser_navigate` + `browser_take_screenshot`) to capture the actual rendered output — not just the source — so you're comparing against the design's real current state.

3. **Explicitly ask for a full re-implementation from the design in the prompt**
   State clearly that the redesign should replace the existing look entirely, not patch individual components. Example prompt:
   > Fully apply the Claude Design UI — don't keep the original design

   Claude Code will then read the design's color tokens, typography, and layout structure, and reimplement the equivalent components against the project's existing data layer (`lib/data/`) and component conventions (MUI Joy `sx` prop) — rather than copying the design's raw HTML/CSS verbatim.

> 💡 After a broad visual change, screenshot the live page (localhost or the deployed URL) with Playwright MCP to confirm dark/light mode and both languages still render correctly before committing.

---

### Directory Structure

```
personal-home-page/
├── projects-list.md              # Master project index
├── tech-profile-en.md            # Generated tech profile in English (gitignored)
├── tech-profile-zh.md            # Generated tech profile in Traditional Chinese (gitignored)
├── tech-profile-en.json          # Generated JSON tech profile in English (gitignored)
├── tech-profile-zh.json          # Generated JSON tech profile in Traditional Chinese (gitignored)
├── global-skills/
│   ├── init-claude-md-zh/        # Traditional Chinese Skill
│   │   ├── SKILL.md
│   │   ├── config.json
│   │   └── template.md
│   └── init-claude-md-en/        # English Skill
│       ├── SKILL.md
│       ├── config.json
│       └── template.md
└── .claude/
    └── skills/
        ├── scan-projects/
        ├── batch-init-claude-md/
        ├── get-latest-version/
        ├── generate-tech-profile/
        └── generate-tech-profile-json/
```
