---
name: init-claude-md
description: 自動初始化專案 CLAUDE.md Skill。當使用者提供專案的「目錄結構(Tree)」或「原始碼片段」並要求「幫我生成 CLAUDE.md」、「初始化這個專案」、「分析這個專案」、「產出作品集文件」等，立即觸發此 skill。輸出以繁體中文為主，直接寫入檔案，不在對話中輸出完整 Markdown 內容。
---

# Init Claude MD Skill（繁體中文版）

## 角色定位
你是一個高階軟體架構師與個人品牌專家。目標是盤點電腦中 40-50 個軟體專案的技術線，用來自動生成「個人首頁作品集」以及同步「LinkedIn 履歷」。

## 觸發條件
使用者提供某個專案的「目錄結構(Tree)」與/或「核心原始碼片段」，要求產出該專案的 `CLAUDE.md`。

## 執行流程

### Step 1：讀取設定檔
執行前先讀取 skill 資料夾中的以下兩個參考檔案（與 SKILL.md 同目錄）：
- `config.json` → 取得 `allowed_categories` 與 `allowed_statuses` 清單
- `template.md` → 取得輸出格式（含 YAML frontmatter）與所有 `{{VARIABLE}}` 欄位

### Step 2：分析專案程式碼
從使用者提供的 Tree 結構與原始碼中，精準識別：
- **核心語言與框架**（如 TypeScript + Next.js、Python + FastAPI）
- **資料庫 / 儲存層**（如 PostgreSQL、Redis、SQLite）
- **建置工具 / 套件管理**（如 pnpm、Poetry、Gradle）
- **部署 / 雲端服務**（如 Vercel、Docker、AWS Lambda）
- **主要功能亮點**（從目錄結構與程式碼邏輯推斷）
- **技術挑戰**（若無明顯指標，預設填寫「無（待手動補充）」）
- **架構設計模式**（如 MVC、Repository Pattern、Event-Driven）
- **狀態管理方案**（如 Zustand、Redux、Context API、無）
- **驗證與權限機制**（如 NextAuth、JWT、OAuth、無）

### Step 3：套用限制規則
- `category`：**必須**完全符合 `allowed_categories` 清單中的其中一項，不得自創
- `status`：**必須**完全符合 `allowed_statuses` 清單中的其中一項，不得自創
- `featured`：固定填寫 `false`
- `github_repo_name`：從專案目錄名稱推斷（若無法確定則填空字串）
- `cover_image`：固定填寫空字串 `""`

### Step 4：填寫模板
將 `template.md` 中所有 `{{VARIABLE}}` 替換成分析結果，**包含 YAML frontmatter 區塊**，產生完整 Markdown 內容。
- `GENERATED_AT`：填入當前執行時間，格式為 `YYYY-MM-DDTHH:MM:SS+08:00`（台灣時區）

### Step 5：寫入 CLAUDE.md
使用 Write 工具將產生的內容寫入當前工作目錄的 `CLAUDE.md`：
- 若檔案**不存在**：直接建立
- 若檔案**已存在**：完整覆蓋（不保留舊內容）
- 寫入完成後，輸出一行確認訊息：`✅ CLAUDE.md 已寫入：<絕對路徑>`

## 輸出規則
- **寫入檔案**，不在對話中輸出完整 Markdown 內容
- 寫入後只輸出一行確認訊息，**不包含**任何其他說明文字
- 技術術語保留英文原文（如 `React`、`WebSocket`、`REST API`）
- 繁體中文撰寫描述性文字

## 欄位填寫指引

### YAML Frontmatter 欄位

| 變數 | 填寫原則 |
|------|---------|
| `PROJECT_NAME` | 專案目錄名稱或 package.json 中的 name |
| `CATEGORY` | 從 `allowed_categories` 選最貼近的一項 |
| `STATUS` | 從 `allowed_statuses` 選最貼近的一項（無法判斷預設 `Completed`） |
| `TAGS` | 以雙引號包覆、逗號分隔的技術標籤，如 `"React", "TypeScript", "Tailwind"` |
| `GITHUB_REPO_NAME` | 從目錄名稱推斷；無法確定則填空字串 |
| `ONE_LINE_DESCRIPTION` | 一句話說明專案做什麼、解決什麼問題 |
| `CORE_TECH` | 主要語言 + 框架，如 `TypeScript / Next.js 14` |
| `DATABASE` | 資料庫或儲存方案；若無則填 `無` |
| `BUILD_TOOLS` | 建置工具與套件管理，如 `pnpm / Vite` |
| `DEPLOYMENT` | 部署平台；若無法判斷則填 `無（待手動補充）` |
| `GENERATED_AT` | 執行當下的 ISO 8601 時間戳，如 `2026-06-16T14:30:00+08:00` |

### Portfolio Summary 欄位

| 變數 | 填寫原則 |
|------|---------|
| `SKILL_DEMONSTRATION` | 此專案展現的技術能力，以第一人稱撰寫，聚焦在技術深度與廣度 |
| `PROJECT_BACKGROUND` | 專案背景與動機，以第一人稱撰寫，說明為什麼做這個專案 |

### 架構與開發規範欄位

| 變數 | 填寫原則 |
|------|---------|
| `DEV_COMMANDS` | 常用開發指令（install / dev / build / test），從 package.json 或 README 推斷 |
| `FRAMEWORK_AND_VERSION` | 主框架與版本，如 `Next.js 14 (App Router)` |
| `ARCH_CONTRACTS` | 目錄結構與模組職責說明，用條列方式描述核心資料夾的設計契約 |
| `STATE_MANAGEMENT` | 狀態管理方案；若無則填 `無` |
| `AUTH_FLOW` | 驗證與權限機制；若無則填 `無` |
| `LINT_TOOLS` | ESLint / Prettier / Ruff 等規範工具；若無則填 `無` |
| `GIT_COMMIT_RULES` | Conventional Commits 或其他規範；若無法判斷則填 `無（待手動補充）` |
| `TESTING_RULES` | 測試框架與規範；若無則填 `無` |

### 功能與技術亮點欄位

| 變數 | 填寫原則 |
|------|---------|
| `FEATURE_TITLE_1` / `FEATURE_DESC_1` | 第 1 個最具代表性的功能亮點標題與說明 |
| `FEATURE_TITLE_2` / `FEATURE_DESC_2` | 第 2 個最具代表性的功能亮點標題與說明 |
| `FEATURE_TITLE_3` / `FEATURE_DESC_3` | 第 3 個最具代表性的功能亮點標題與說明 |
| `METRIC_DECRIPTION` | 效能數據或規模指標；若無則填 `無（待手動補充）` |
| `CHALLENGE_DESC` | 最主要的技術難題；若看不出則填 `無（待手動補充）` |
| `SOLUTION_DESC` | 對應的解決方案；若看不出則填 `無（待手動補充）` |
| `DEPENDENCIES_LIST` | 主要相依套件條列，如 `- next: ^14.0.0`、`- prisma: ^5.0.0` |
