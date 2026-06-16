---
name: generate-tech-profile
description: Generate a personal tech profile and project mapping from all latest-version CLAUDE.md files. Produces a structured Markdown file suitable for building a personal website with a skill tree / mind map, where each technology links to related projects. Triggers when the user says "generate tech profile", "build tech profile", "generate skill tree", "生成技術檔案", "產出個人技術樹", or "建立技術側寫".
---

# Generate Tech Profile Skill

## Goal
Read all CLAUDE.md files from projects that have the latest `skill_version`, extract structured frontmatter data (tags, category, status, description, etc.), then generate a comprehensive personal tech profile Markdown file (`tech-profile.md`) that:

1. Maps every technology/tool to the projects that use it
2. Groups skills into a hierarchical tech tree (for rendering as mind map or interactive tree in a personal website)
3. Captures project experience summaries per domain
4. Is machine-readable enough for a frontend to consume directly

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

### Step 4: Build the tech → projects mapping
From all collected `tags` arrays, build an inverted index:

```
tech_tag → [{ project_name, category, status, one_line_description }]
```

Sort projects under each tag by status priority: Production > Maintenance > Archived > Side Project > Prototype.

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

### Step 6: Generate `tech-profile.md`
Write the file to the **current working directory** as `tech-profile.md`.

Use this exact structure:

```markdown
---
generated_at: <ISO8601 timestamp in +08:00>
source_version: "<latest version string>"
total_projects: <N>
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
> `[P]` = Production, `[M]` = Maintenance, `[S]` = Side Project, `[A]` = Archived

### Frontend
#### React
- **project-name** [P] — one_line_description
- ...

#### Next.js
- ...

### Backend
#### NestJS
- ...

[... repeat for all domains and tags ...]

---

## 📦 Project Index

> All projects with latest CLAUDE.md, sorted by domain then status.

| Project | Domain | Status | Core Tech | Description |
|---------|--------|--------|-----------|-------------|
| project-name | Frontend Web Development | Production | TypeScript / Next.js 15 | one_line_description |
| ... |

---

## 🧠 Domain Expertise Summary

> One paragraph per domain (synthesized from 技術亮點 highlights across all projects in that domain).

### Frontend
<synthesized paragraph summarizing frontend expertise from all frontend projects' 技術亮點>

### Backend
<synthesized paragraph>

### AI / LLM
<synthesized paragraph>

### DevOps / Infrastructure
<synthesized paragraph>

### Mobile
<synthesized paragraph>

### Tools & Automation
<synthesized paragraph>

---

## 🏷 All Tags (Flat Index)

> Sorted alphabetically. Each tag links to the domain it belongs to and lists project count.

| Tag | Domain | Projects |
|----|--------|---------|
| Azure OpenAI | AI / LLM | 2 |
| BullMQ | Backend | 1 |
| ... |

```

### Step 7: Report results
After writing `tech-profile.md`, output a summary:

```
✅ tech-profile.md generated
- Projects included: N (skill_version: X.Y)
- Unique technologies: M tags
- Domains covered: [Frontend, Backend, AI / LLM, ...]
- Output: <absolute path to tech-profile.md>
```

## Notes
- Read CLAUDE.md files in parallel (batch of up to 10) to reduce execution time
- If a project's CLAUDE.md frontmatter is malformed or missing required fields, skip it and log a warning (do not abort)
- The `技術亮點` text in `## 📋 Portfolio Summary` is the most valuable signal for synthesizing domain expertise paragraphs — prioritize it
- Status badge mapping: Production → `[P]`, Maintenance → `[M]`, Side Project → `[S]`, Archived → `[A]`, Prototype → `[Proto]`
- `featured: true` projects should be marked with ⭐ in the Project Index
- The output file is intentionally verbose and machine-readable — it is designed to be consumed by a personal website build step, not read by humans directly
- Write in English (frontmatter + section headers) but preserve Chinese text from `one_line_description` and `技術亮點` as-is
- Always overwrite `tech-profile.md` on each run; it is a generated artifact
