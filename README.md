# Personal Home Page — Portfolio Automation Kit

> 自動化作品集管理工具，透過 Claude Code Skills 為所有專案生成標準化 CLAUDE.md  
> Automated portfolio management kit using Claude Code Skills to generate standardized CLAUDE.md across all projects.

---

## 目錄 / Table of Contents

- [中文說明](#中文說明)
- [English Guide](#english-guide)

---

## 中文說明

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

---

### 使用流程

```
1. 複製 init-claude-md → ~/.claude/skills/（只需做一次）
2. 在任意專案目錄執行 /init-claude-md
3. 回到此 repo，執行 /scan-projects 更新索引
4. 在 projects-list.md 將不想處理的專案 Active 欄位改為 ❌
5. 執行 /batch-init-claude-md 批次補齊未初始化的專案
6. 執行 /generate-tech-profile 產出個人技術樹（tech-profile.md）
```

> 💡 `/batch-init-claude-md` 只會處理 Active 為 ✅ 且尚未有 CLAUDE.md（或版本過舊）的專案，因此**建議先整理 `projects-list.md` 再批次執行**，避免對不需要的專案進行生成。

> 💡 `/generate-tech-profile` 只讀取版本號等於當前最新版的專案，確保資料品質一致。每次執行都會同時覆寫 `tech-profile-en.md` 與 `tech-profile-zh.md`，可在 `/batch-init-claude-md` 完成後隨時重新生成。

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

## English Guide

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

---

### Workflow

```
1. Copy init-claude-md → ~/.claude/skills/ (one-time setup)
2. Run /init-claude-md in any project directory
3. Return to this repo, run /scan-projects to refresh the index
4. In projects-list.md, set the Active column to ❌ for any projects you want to skip
5. Run /batch-init-claude-md to batch-fill projects that are missing CLAUDE.md
6. Run /generate-tech-profile to produce tech-profile.md (personal website data source)
```

> 💡 `/batch-init-claude-md` only processes projects where Active is ✅ and CLAUDE.md is missing or outdated. **It's recommended to review `projects-list.md` and exclude unwanted projects before running the batch**, to avoid generating files for projects you don't need.

> 💡 `/generate-tech-profile` only reads projects whose version matches the current latest, ensuring consistent data quality. Re-run it anytime after `/batch-init-claude-md` completes — it always overwrites both `tech-profile-en.md` and `tech-profile-zh.md`.

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

### Directory Structure

```
personal-home-page/
├── projects-list.md              # Master project index
├── tech-profile-en.md            # Generated tech profile in English (gitignored)
├── tech-profile-zh.md            # Generated tech profile in Traditional Chinese (gitignored)
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
        └── generate-tech-profile/
```
