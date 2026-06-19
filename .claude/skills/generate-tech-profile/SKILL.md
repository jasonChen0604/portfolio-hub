---
name: generate-tech-profile
description: Generate a personal tech profile and project mapping from all latest-version CLAUDE.md files. Produces TWO output files — an English version (tech-profile-en.md) and a Traditional Chinese version (tech-profile-zh.md) — each a structured Markdown suitable for building a personal website skill tree / mind map. Triggers when the user says "generate tech profile", "build tech profile", "generate skill tree", "生成技術檔案", "產出個人技術樹", or "建立技術側寫".
---

# Generate Tech Profile Skill

## Goal
Read all CLAUDE.md files from projects that have the latest `skill_version`, extract structured frontmatter data (tags, category, status, description, etc.), then generate **two** comprehensive personal tech profile Markdown files:

- `tech-profile-en.md` — English version (section headers, domain names, expertise paragraphs all in English)
- `tech-profile-zh.md` — Traditional Chinese version (section headers, domain names, expertise paragraphs all in Traditional Chinese)

Both files share the same data and structure, but differ in language for all human-readable text. Both are designed to be consumed by a personal website as the data source for skill tree / mind map rendering.

## Execution Steps

### Step 1: Get the latest version
Run the `/get-latest-version` skill to obtain the current latest `skill_version` string (e.g. `"2.0"`).
- If `none` is returned, abort and tell the user to run `/batch-init-claude-md` first.

### Step 2: Filter projects with latest version
Read `projects-list.md` and filter rows where:
1. "Active" column is ✅
2. "CLAUDE.md" column is ✅
3. "Version" column equals the latest version string from Step 1

Collect each matching project's **Path** column value.
Expand `~/` to `/Users/jason/` when constructing absolute paths.

### Step 3: Read each project's CLAUDE.md frontmatter
For each filtered project path, read `<path>/CLAUDE.md` and extract the YAML frontmatter block (between the `---` delimiters).

Extract these fields (use `—` or empty array if missing):
- `project_name`
- `category`
- `status`
- `tags` (array)
- `one_line_description`
- `core_tech`
- `database`
- `deployment`
- `featured`

Also read the `## 📋 Portfolio Summary` section body to extract:
- `技術亮點` bullet point text (the key technical highlight)

Also record:
- `path` — the project's absolute path (used for grouping in Step 3b)

After extracting fields, **derive a `display_name`** for each project using this logic:

#### Privacy-Safe Display Name Rules

**The core rule: `display_name` must describe only system function — never a client, company, brand, or product name.**

Two categories of names require sanitization:

**Category 1 — Project code prefixes** (structural identifiers in `project_name`):
- Patterns: `pa##`, `pt##`, `wp##`, `mm##`, `wistron-`, or any 2–3 letter prefix followed by 2 digits (e.g. `pa27`, `pt07`, `wp18`)
- Action: strip prefix, derive name from `one_line_description`

**Category 2 — Client/brand/product names** (appear in `project_name` directly or as the product display name after stripping suffixes):
- Known sensitive names (non-exhaustive, apply judgment for any unfamiliar name):
  `enbg`, `qsquare`, `ltutor`, `uplusa`, `cmn`, `ses`, `pixis`, `atmos`, `alpha`, `cgu`, `qubear`, `wistron`, `n8n` (when used as a client project name rather than the tool itself)
- Also applies when the **derived display name itself** still contains a brand/client name — re-derive from `one_line_description`
- Action: replace with a purely functional description from `one_line_description`

**Deriving a safe display name from `one_line_description`:**
1. Extract the core system/feature name — translate Chinese to English for EN file; keep Chinese for ZH file
2. Append role suffix: `-web` → `— Frontend`, `-server` → `— Backend`, `-nest-server` → `— Backend (NestJS)`, `-docker` → `— Docker / Infra`, `-ios` / `-android` → `— iOS App` / `— Android App`; or derive from `core_tech`
3. If `one_line_description` also contains the client/brand name, paraphrase around the **function** not the brand

**Final check before output:** scan every `display_name` for known brand/client tokens (`enbg`, `qsquare`, `ltutor`, `uplusa`, `cmn`, `ses`, `pixis`, `atmos`, `alpha-ai`, `cgu`, `qubear`, `wistron`). If found, re-derive.

**Safe (generic tech/function words only) — keep as-is after cleaning:**
`gitlab-ci-template` → "GitLab CI/CD Template Library", `tool_website` → "Utility Tools Website"

Examples:
| `project_name` | ❌ Unsafe draft | ✅ `display_name` (EN) |
|---|---|---|
| `pa27-lab-space-and-rack-management-web` | — | Lab Space & Rack Management — Frontend |
| `pa27-lab-space-and-rack-management-nest-server` | — | Lab Space & Rack Management — Backend (NestJS) |
| `pt07-ai-tcr-server` | — | AI Test Coverage Analysis — Backend |
| `pa47-project-management-system-web` | — | Project Management System — Frontend |
| `pa95-enbg-workplace-web` | ENBG Workplace Portal — Frontend | Enterprise Employee Portal — Frontend |
| `qsquare-ios` | Qsquare Mall App — iOS | Shopping Mall Membership App — iOS |
| `ltutor-admin-web-ui` | LTutor Education Platform — Admin | Online Tutoring Platform — Admin Panel |
| `uplusa_backend` | UPlusA E-commerce — Backend | Consumer E-commerce Platform — Backend |
| `cmn-server` | CMN Medical Clinic — Backend | Medical Clinic Appointment System — Backend |
| `ses_resource_admin_frontend` | SES Resource Platform — Admin | Construction Resource Management — Admin |
| `pixis_visitor_web` | Pixis Visitor Management — Frontend | Visitor & Wi-Fi Access Portal — Frontend |
| `logbooks_ios` | ATMOS Diving — iOS App | Dive Log & Sync App — iOS |
| `alpha-ai-center-web` | Alpha AI Center — Frontend | Enterprise AI Service Hub — Frontend |
| `cgu-frontend` | CGU Innovation Platform — Frontend | University Industry-Academia Matching — Frontend |
| `qu-bear` | QuBear Learning App — Mobile | Children's Learning App — Mobile |
| `gitlab-ci-template` | — | GitLab CI/CD Template Library |

### Step 3b: Group projects by product
After deriving display names, group projects that belong to the same product/system:

**Grouping logic (apply both; a project may match either):**
1. Projects sharing the same **parent directory path** (e.g. all under `.../PA27_Lab_Space_and_Rack_Management/`) → one product group
2. Projects whose `project_name` shares a **common prefix** after stripping the role suffix (`-web`, `-server`, `-nest-server`, `-docker`, `-backend`, `-frontend`, `-api`, `-cli`) → one product group

**For each group:**
- Assign a **product display name**: the common functional name without the role suffix (e.g. "Lab Space & Rack Management")
- List each member's **role** (Frontend / Backend / Backend NestJS / Docker / Infra / CLI / etc.)
- Use the highest-priority status among members as the group's representative status

**In the Project Index (Step 6):** grouped products appear as **one row** listing all roles:
```
| Lab Space & Rack Management | Frontend · Backend (Laravel) · Backend (NestJS) · Docker | Backend | Production | TypeScript / Next.js + NestJS + Laravel | <description> |
```
Ungrouped (solo) projects appear as individual rows as before.

**Tech Tree (Step 4/5):** tags still map to individual component `display_name` entries — grouping is only applied to the Project Index, not the Tech Tree.

### Step 4: Build the tech → projects mapping
From all collected `tags` arrays, build an inverted index:

```
tech_tag → [{ project_name, category, status, one_line_description }]
```

Sort projects under each tag by status priority: Production > In Progress > Maintenance > Side Project > Archived > Prototype.

### Step 5: Group tags into skill domains
Map each tag to one of the following top-level domains. Use this mapping (extend with best-fit logic for tags not listed):

```
Frontend:
  React, Next.js, Vue.js, Nuxt 3, Vite, TypeScript, JavaScript, CSS Modules,
  MUI, Tailwind CSS, Redux, Redux-Saga, React Native, Expo, WebView, Static Site,
  Ant Design, HTML, CSS

Backend:
  Node.js, NestJS, Express, Laravel, PHP, Python, FastAPI, Flask, Fastify,
  REST API, GraphQL, WebSocket, BullMQ, Prisma, TypeORM, Swagger, OpenAPI

AI / LLM:
  LangChain, LangGraph, LangChain.js, Azure OpenAI, OpenAI, LLM, RAG, pgvector,
  Weaviate, Embedding, Fine-tuning, Claude, Prompt Engineering, MCP, AI Agent,
  n8n, LLM Orchestration

Database:
  PostgreSQL, MySQL, MongoDB, Redis, SQLite, Oracle, OCI8, pgvector, Prisma,
  TypeORM, SQL Server, Google Sheet

DevOps / Infrastructure:
  Docker, Docker Compose, Docker Swarm, Nginx, GitLab CI/CD, GitHub Actions,
  CI/CD, Kubernetes, NAS, Reverse Proxy, Nginx Proxy Manager, Shell Script

Mobile:
  React Native, Expo, iOS, Android, Swift, Java, WebView, Firebase, Push Notification

Tools & Automation:
  Chrome Extension, Gmail API, Google Sheet, n8n, Swagger, OpenAPI, MCP,
  Claude Code, Bash, Automation

Languages:
  TypeScript, JavaScript, PHP, Python, Java, Ruby, Go, Rust, SQL, Bash
```

A tag can appear in multiple domains if it fits.
Tags with no match → place in "Other".

### Step 6: Generate both output files in parallel

Write both files simultaneously to the **current working directory**.

---

#### `tech-profile-en.md` structure (English)

```markdown
---
generated_at: <ISO8601 timestamp in +08:00>
source_version: "<latest version string>"
total_projects: <N>
lang: en
---

# Jason Chen — Personal Tech Profile

> Auto-generated from <N> CLAUDE.md files (skill_version: <version>).
> Each technology links to the projects that use it.
> Intended for use in personal website skill tree / mind map rendering.

---

## 🗂 Domain Overview

| Domain | Technologies | Projects |
|--------|-------------|----------|
| Frontend | React, Next.js, ... | N |
| Backend | NestJS, Laravel, ... | N |
| AI / LLM | LangGraph, Azure OpenAI, ... | N |
| Database | PostgreSQL, Redis, ... | N |
| DevOps / Infrastructure | Docker, GitLab CI/CD, ... | N |
| Mobile | React Native, Expo, ... | N |
| Tools & Automation | Chrome Extension, n8n, ... | N |
| Languages | TypeScript, PHP, Python, ... | N |

---

## 🌳 Tech Tree (Skill → Projects Mapping)

> Format: each technology lists all projects that use it, grouped by domain.
> `[P]` = Production, `[IP]` = In Progress, `[M]` = Maintenance, `[S]` = Side Project, `[A]` = Archived

### Frontend
#### React
- **project-name** [P] — one_line_description (in English — translate from Chinese if needed)
- ...

[... repeat for all domains and tags ...]

---

## 📦 Project Index

> All projects with latest CLAUDE.md, sorted by domain then status.

| Project | Domain | Status | Core Tech | Description |
|---------|--------|--------|-----------|-------------|
| project-name | Frontend Web Development | Production | TypeScript / Next.js 15 | <English description> |
| ... |

---

## 🧠 Domain Expertise Summary

> One paragraph per domain, written in English.

### Frontend
<English paragraph synthesized from 技術亮點 of all frontend projects>

### Backend
<English paragraph>

### AI / LLM
<English paragraph>

### DevOps / Infrastructure
<English paragraph>

### Mobile
<English paragraph>

### Tools & Automation
<English paragraph>

---

## 🏷 All Tags (Flat Index)

| Tag | Domain | Projects |
|----|--------|---------|
| Azure OpenAI | AI / LLM | 2 |
| BullMQ | Backend | 1 |
| ... |
```

---

#### `tech-profile-zh.md` structure (Traditional Chinese)

```markdown
---
generated_at: <ISO8601 timestamp in +08:00>
source_version: "<latest version string>"
total_projects: <N>
lang: zh-TW
---

# Jason Chen — 個人技術檔案

> 自動從 <N> 份 CLAUDE.md（skill_version: <version>）彙整生成。
> 每項技術皆對應使用該技術的專案清單。
> 供個人網站技術樹 / 心智圖渲染使用。

---

## 🗂 領域概覽

| 領域 | 技術 | 專案數 |
|------|------|--------|
| 前端開發 | React, Next.js, ... | N |
| 後端開發 | NestJS, Laravel, ... | N |
| AI / 大型語言模型 | LangGraph, Azure OpenAI, ... | N |
| 資料庫 | PostgreSQL, Redis, ... | N |
| DevOps / 基礎架構 | Docker, GitLab CI/CD, ... | N |
| 行動應用 | React Native, Expo, ... | N |
| 工具與自動化 | Chrome Extension, n8n, ... | N |
| 程式語言 | TypeScript, PHP, Python, ... | N |

---

## 🌳 技術樹（技術 → 專案對應）

> 格式：每項技術列出所有使用它的專案，依領域分組。
> `[P]` = 正式上線, `[IP]` = 開發中, `[M]` = 維護中, `[S]` = 個人專案, `[A]` = 已封存

### 前端開發
#### React
- **project-name** [P] — one_line_description（保留原始中文）
- ...

[... 其餘領域與技術依序列出 ...]

---

## 📦 專案索引

> 所有擁有最新 CLAUDE.md 的專案，依領域與狀態排序。

| 專案 | 領域 | 狀態 | 核心技術 | 描述 |
|------|------|------|---------|------|
| project-name | 前端開發 | 正式上線 | TypeScript / Next.js 15 | one_line_description |
| ... |

---

## 🧠 領域專業摘要

> 每個領域一段敘述，從各專案的「技術亮點」合成，以繁體中文撰寫。

### 前端開發
<從前端專案的「技術亮點」合成的繁體中文段落>

### 後端開發
<繁體中文段落>

### AI / 大型語言模型
<繁體中文段落>

### DevOps / 基礎架構
<繁體中文段落>

### 行動應用
<繁體中文段落>

### 工具與自動化
<繁體中文段落>

---

## 🏷 技術標籤索引

| 標籤 | 所屬領域 | 專案數 |
|------|---------|--------|
| Azure OpenAI | AI / 大型語言模型 | 2 |
| BullMQ | 後端開發 | 1 |
| ... |
```

---

### Domain name translation table (EN → ZH-TW)

| English | 繁體中文 |
|---------|---------|
| Frontend | 前端開發 |
| Backend | 後端開發 |
| AI / LLM | AI / 大型語言模型 |
| Database | 資料庫 |
| DevOps / Infrastructure | DevOps / 基礎架構 |
| Mobile | 行動應用 |
| Tools & Automation | 工具與自動化 |
| Languages | 程式語言 |
| Other | 其他 |

### Status translation table (EN → ZH-TW)

| English | 繁體中文 |
|---------|---------|
| Production | 正式上線 |
| In Progress | 開發中 |
| Maintenance | 維護中 |
| Side Project | 個人專案 |
| Archived | 已封存 |
| Prototype | 原型 |

### Step 7: Report results
After writing both files, output a summary:

```
✅ Tech profile generated (2 files)
- Projects included: N (skill_version: X.Y)
- Unique technologies: M tags
- Domains covered: [Frontend, Backend, AI / LLM, ...]
- tech-profile-en.md → <absolute path>
- tech-profile-zh.md → <absolute path>
```

## Notes
- Read CLAUDE.md files in parallel (batch of up to 10) to reduce execution time
- Write both output files in parallel (use two Write tool calls simultaneously)
- If a project's CLAUDE.md frontmatter is malformed or missing required fields, skip it and log a warning (do not abort)
- The `技術亮點` text is the most valuable signal for Domain Expertise Summary paragraphs — prioritize it for both languages
- For `tech-profile-en.md`: translate `one_line_description` and `技術亮點` content into natural English; do NOT just leave Chinese text as-is
- For `tech-profile-zh.md`: use `one_line_description` as-is (already Chinese); translate status/domain labels using the tables above
- Status badge mapping: Production → `[P]`, In Progress → `[IP]`, Maintenance → `[M]`, Side Project → `[S]`, Archived → `[A]`, Prototype → `[Proto]`
- `featured: true` projects should be marked with ⭐ in the Project Index of both files
- Always overwrite both files on each run; they are generated artifacts
- The old `tech-profile.md` (without language suffix) is deprecated — do NOT write it
- **Privacy**: `display_name` must describe only system function — never a client, company, or brand name. This applies to ALL projects, not just those with `pa##`/`pt##` codes. Known sensitive names include: `enbg`, `qsquare`, `ltutor`, `uplusa`, `cmn`, `ses`, `pixis`, `atmos`, `alpha` (as brand), `cgu`, `qubear`, `wistron`. After deriving every display name, scan it for these tokens and re-derive from `one_line_description` if any are found. The Tech Tree, Project Index, and all output sections must be free of client/company/brand identifiers.
- **Grouping**: Projects sharing a parent directory or common name prefix are grouped as one product row in the Project Index. The Tech Tree still lists individual component display names under each tag.
