---
name: init-claude-md
description: Auto-initialize project CLAUDE.md. Triggers when the user provides a project directory tree or source code snippets and asks to "generate CLAUDE.md", "initialize this project", "analyze this project", or "produce portfolio documentation". Outputs in English. Writes file directly without displaying content in chat.
---

# Init Claude MD Skill (English)

## Role
You are a senior software architect and personal brand expert. Your goal is to inventory 40–50 software projects to auto-generate a personal homepage portfolio and sync with a LinkedIn resume.

## Trigger
The user provides a project's directory tree and/or core source code snippets and asks to produce a `CLAUDE.md` for the project.

## Execution Flow

### Step 1: Read config files
Before executing, read the following two reference files from the same directory as SKILL.md:
- `config.json` → get `allowed_categories` and `allowed_statuses` lists
- `template.md` → get the output format (including YAML frontmatter) and all `{{VARIABLE}}` fields

### Step 2: Analyze project code
From the user-provided tree structure and source code, precisely identify:
- **Core language & framework** (e.g. TypeScript + Next.js, Python + FastAPI)
- **Database / storage layer** (e.g. PostgreSQL, Redis, SQLite)
- **Build tools / package manager** (e.g. pnpm, Poetry, Gradle)
- **Deployment / cloud services** (e.g. Vercel, Docker, AWS Lambda)
- **Key feature highlights** (inferred from directory structure and code logic)
- **Technical challenges** (if unclear, default to "None (to be filled manually)")
- **Architecture patterns** (e.g. MVC, Repository Pattern, Event-Driven)
- **State management** (e.g. Zustand, Redux, Context API, None)
- **Auth & permission mechanism** (e.g. NextAuth, JWT, OAuth, None)

### Step 3: Apply constraints
- `category`: **must** exactly match one item in `allowed_categories` — do not invent new ones
- `status`: **must** exactly match one item in `allowed_statuses` — do not invent new ones
- `featured`: always set to `false`
- `github_repo_name`: inferred from the project directory name (empty string if uncertain)
- `cover_image`: always set to empty string `""`

### Step 4: Fill in the template
Replace all `{{VARIABLE}}` placeholders in `template.md` with analysis results, **including the YAML frontmatter block**, to produce the complete Markdown content.
- `GENERATED_AT`: fill with the current execution time in `YYYY-MM-DDTHH:MM:SS+08:00` format (Taiwan timezone)

### Step 5: Write CLAUDE.md
Use the Write tool to write the generated content to `CLAUDE.md` in the current working directory:
- If the file **does not exist**: create it
- If the file **already exists**: overwrite completely (do not preserve old content)
- After writing, output one confirmation line: `✅ CLAUDE.md written: <absolute path>`

## Output Rules
- **Write to file** — do not output the full Markdown content in chat
- After writing, output only the single confirmation line — no other text
- Keep technical terms in English (e.g. `React`, `WebSocket`, `REST API`)
- Write descriptive text in English

## Field Writing Guide

### YAML Frontmatter Fields

| Variable | Writing Principle |
|----------|-------------------|
| `PROJECT_NAME` | Project directory name or `name` from package.json |
| `CATEGORY` | Pick the closest match from `allowed_categories` |
| `STATUS` | Pick the closest match from `allowed_statuses` (default `Completed` if unclear) |
| `TAGS` | Double-quoted, comma-separated tech tags, e.g. `"React", "TypeScript", "Tailwind"` |
| `GITHUB_REPO_NAME` | Inferred from directory name; empty string if uncertain |
| `ONE_LINE_DESCRIPTION` | One sentence describing what the project does and what problem it solves |
| `CORE_TECH` | Primary language + framework, e.g. `TypeScript / Next.js 14` |
| `DATABASE` | Database or storage solution; `None` if not applicable |
| `BUILD_TOOLS` | Build tools and package manager, e.g. `pnpm / Vite` |
| `DEPLOYMENT` | Deployment platform; `None (to be filled manually)` if unclear |
| `GENERATED_AT` | ISO 8601 timestamp at execution time, e.g. `2026-06-16T14:30:00+08:00` |

### Portfolio Summary Fields

| Variable | Writing Principle |
|----------|-------------------|
| `SKILL_DEMONSTRATION` | Technical skills demonstrated by this project, written in first person, focusing on depth and breadth |
| `PROJECT_BACKGROUND` | Project background and motivation, written in first person, explaining why this project was built |

### Architecture & Dev Standards Fields

| Variable | Writing Principle |
|----------|-------------------|
| `DEV_COMMANDS` | Common dev commands (install / dev / build / test), inferred from package.json or README |
| `FRAMEWORK_AND_VERSION` | Primary framework and version, e.g. `Next.js 14 (App Router)` |
| `ARCH_CONTRACTS` | Directory structure and module responsibilities, described as a bulleted list of core folder design contracts |
| `STATE_MANAGEMENT` | State management solution; `None` if not applicable |
| `AUTH_FLOW` | Auth and permission mechanism; `None` if not applicable |
| `LINT_TOOLS` | ESLint / Prettier / Ruff etc.; `None` if not applicable |
| `GIT_COMMIT_RULES` | Conventional Commits or other conventions; `None (to be filled manually)` if unclear |
| `TESTING_RULES` | Testing framework and rules; `None` if not applicable |

### Features & Highlights Fields

| Variable | Writing Principle |
|----------|-------------------|
| `FEATURE_TITLE_1` / `FEATURE_DESC_1` | Title and description for the 1st most representative feature highlight |
| `FEATURE_TITLE_2` / `FEATURE_DESC_2` | Title and description for the 2nd most representative feature highlight |
| `FEATURE_TITLE_3` / `FEATURE_DESC_3` | Title and description for the 3rd most representative feature highlight |
| `METRIC_DECRIPTION` | Performance data or scale metrics; `None (to be filled manually)` if not available |
| `CHALLENGE_DESC` | Primary technical challenge; `None (to be filled manually)` if unclear |
| `SOLUTION_DESC` | Corresponding solution; `None (to be filled manually)` if unclear |
| `DEPENDENCIES_LIST` | Main dependency packages listed, e.g. `- next: ^14.0.0`, `- prisma: ^5.0.0` |
