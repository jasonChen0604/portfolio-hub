---
name: generate-tech-profile-json
description: Generate structured JSON tech profile files from all latest-version CLAUDE.md files. Outputs a split-file directory tech-profile/ (not monolithic JSON) for efficient incremental updates. Triggers when the user says "generate tech profile json", "build json profile", "export json profile", "生成 JSON 技術檔案", "產出 JSON 技術樹", or "建立 JSON 技術報告".
---

# Generate Tech Profile JSON Skill

## Goal
Read all CLAUDE.md files from projects with the latest `skill_version`, extract structured frontmatter data, then generate a **`tech-profile/` split-file directory** (schema version 2.0).

**Output layout:**
```
tech-profile/
├── meta.json                  # meta + profile + linkedin + id_map
├── domains-en.json / domains-zh.json
├── tag-index-en.json / tag-index-zh.json
├── product-groups-en.json / product-groups-zh.json
└── projects/
    ├── <hash>.en.json         # one file per project, EN
    └── <hash>.zh.json         # one file per project, ZH-TW
```

**Why split?** Each file is 1–15KB. Incremental runs only rewrite changed project files + rebuild the 6 index files. Token cost scales with changed projects, not total project count.

**Incremental update logic:**
1. Load existing `tech-profile/meta.json` → get `id_map` and `source_version`
2. Load all `tech-profile/projects/*.en.json` → build in-memory cache
3. For each project: compute hash, compare cached `skill_version`
   - Unchanged → skip (reuse cached file, zero token cost)
   - New or changed → read CLAUDE.md, write `<hash>.en.json` + `<hash>.zh.json`
4. Always rebuild index files (domains, tag-index, product-groups) from all project files
5. Write `meta.json` with updated totals

On first run (no existing `tech-profile/`), process all projects.

---

## JSON Schema

Both files conform to this schema:

```jsonc
{
  "meta": {
    "generated_at": "2026-06-19T12:00:00+08:00",  // ISO8601 +08:00
    "source_version": "2.0",
    "total_projects": 95,
    "lang": "en"  // "en" | "zh-TW"
  },

  "profile": {
    "name": "Jason Chen",
    "title": "Full-Stack Engineer",           // EN: "Full-Stack Engineer" / ZH: "全端工程師"
    "title_alt": "Software Engineer",         // EN alternative / ZH: "軟體工程師"
    "email": "jason.chen.develop@gmail.com",
    "summary": "<paragraph>",                 // EN paragraph / ZH 繁體段落 (3–5 sentences, synthesized from all 技術亮點)
    "linkedin_about": "<paragraph>",          // LinkedIn-ready About section (EN) / ZH: LinkedIn「關於」欄位 (ZH)
    "years_of_experience": 8,                 // derived from oldest project last_commit
    "total_projects": 95
  },

  "domains": [
    {
      "id": "frontend",                       // snake_case, stable identifier
      "label": "Frontend",                    // EN label / ZH: "前端開發"
      "icon": "🖥",
      "project_count": 10,
      "summary": "<EN paragraph>",           // EN: domain expertise paragraph / ZH: 繁體段落
      "skills": [
        {
          "tag": "React",
          "level": "expert",                  // "expert" | "proficient" | "familiar" — derived from project count + status
          "project_count": 8,                 // MUST equal projects.length — derived from it, not estimated separately
          "projects": [                       // ALL project ids that have this tag — no sampling, no truncation
            "project-management-system-frontend",
            "lab-space-rack-management-frontend"
            // ... every matching project id
          ]
        }
      ]
    }
  ],

  "projects": [
    {
      "id": "3a7f2c1b09e4",                            // SHA-256[:12] of project folder path relative to ~/project/
      "name": "Project Management System — Frontend",  // display_name (privacy-safe), never a brand/client name
      "category": "Enterprise Web Application",   // EN category / ZH: 繁體類別
      "status": "Production",                      // EN / ZH translated
      "status_badge": "[P]",
      "featured": false,
      "tags": ["React", "NestJS", "Azure AD", "WebSocket", "CASL"],
      "core_tech": "TypeScript / React 18 + Vite 3",
      "database": "PostgreSQL, Redis",
      "deployment": "Docker Swarm / GitLab CI",
      "description": "...",                        // EN translated / ZH original
      "domain_primary": "frontend",                // primary domain id
      "domains": ["frontend", "backend"]           // all applicable domain ids
    }
  ],

  "tag_index": [
    {
      "tag": "React",
      "domain_id": "frontend",
      "domain_label": "Frontend",             // EN / ZH translated
      "project_count": 8,
      "level": "expert"
    }
  ],

  "linkedin": {
    "headline": "Full-Stack Engineer | NestJS · Next.js · Docker · AI/LLM",   // EN / ZH
    "about": "<3–5 sentence paragraph>",      // same as profile.linkedin_about, formatted for direct paste
    "skills_list": ["TypeScript", "React", "NestJS", "Next.js", "Docker", "PostgreSQL", "LangGraph", "Azure OpenAI"],
    // top 20 skills sorted by: featured projects first, then project_count desc
    "experience_highlights": [
      // For each domain with ≥3 projects, one bullet point summarizing key projects by display_name (no raw project codes)
      "Led development of an enterprise lab management platform serving 500+ engineers across multiple factory sites, built with NestJS + Next.js + Docker Swarm."
    ]
  },

  "product_groups": [
    {
      "product_name": "Lab Space & Rack Management",
      "project_count": 4,
      "roles": ["Frontend", "Backend (Laravel)", "Backend (NestJS)", "Docker / Infra"],
      "status": "Production",
      "projects": [
        { "id": "lab-space-rack-management-frontend", "role": "Frontend", "status": "Production" }
      ]
      // projects[] contains id + role + status only — full data lives in projects[]
    }
  ]
}
```

---

## Execution Steps

### Step 1: Get the latest version
Run the `/get-latest-version` skill.
- If `none`, abort and tell the user to run `/batch-init-claude-md` first.

### Step 2: Filter projects
Read `projects-list.md`, filter rows where:
1. "Active" column is ✅
2. "CLAUDE.md" column is ✅
3. "Version" column equals the latest version string

Collect each matching project's **Path** column. Expand `~/` → `/Users/jason/`.

### Step 3: Read CLAUDE.md frontmatter (batch up to 10 in parallel)
For each project, read `<path>/CLAUDE.md` and extract:
- `project_name`, `category`, `status`, `tags` (array), `one_line_description`
- `core_tech`, `database`, `deployment`, `featured`
- Also extract `技術亮點` bullet text from `## 📋 Portfolio Summary` section body
- Also record `path` — the project's absolute path (used for grouping in Step 3b)

After extracting fields, **derive a `display_name`** for each project:

#### Privacy-Safe Display Name Rules

**The core rule: `display_name` must describe only system function — never a client, company, brand, or product name.**

Two categories of names require sanitization:

**Category 1 — Project code prefixes** (structural identifiers in `project_name`):
- Patterns: `pa##`, `pt##`, `wp##`, `mm##`, `wistron-`, or any 2–3 letter prefix followed by 2 digits (e.g. `pa27`, `pt07`, `wp18`)
- Action: strip prefix, derive name from `one_line_description`

**Category 2 — Client/brand/product names** (appear in `project_name` directly or as the display name after stripping suffixes):
- Known sensitive names (non-exhaustive, apply judgment for any unfamiliar name):
  `enbg`, `qsquare`, `ltutor`, `uplusa`, `cmn`, `ses`, `pixis`, `atmos`, `alpha` (as brand prefix), `cgu`, `qubear`, `wistron`
- Also applies when the **derived display name itself** still contains a brand/client name — re-derive from `one_line_description`
- Action: replace with a purely functional description from `one_line_description`

**Deriving a safe display name:**
1. Extract the core system/feature name from `one_line_description` — translate to English for EN file; keep Chinese for ZH file
2. Append role suffix: `-web` → `— Frontend`, `-server` → `— Backend`, `-nest-server` → `— Backend (NestJS)`, `-docker` → `— Docker / Infra`, `-ios` / `-android` → `— iOS App` / `— Android App`; or derive from `core_tech`
3. If `one_line_description` also contains the client/brand name, paraphrase around the **function** not the brand

**Final check before writing output:** scan every `display_name` for known brand/client tokens. If found, re-derive.

- Assign each project a stable **`id`**: `SHA-256(relPath)[:12]` where `relPath` is the project folder path relative to `~/project/` (e.g. `"wistron/PA27_Lab_Space_and_Rack_Management/pa27-lab-space-and-rack-management-web"`). This keeps IDs opaque (no brand/client leak) and stable (path doesn't change unless project is moved). In case of collision (extremely rare), append `__N` suffix before re-hashing.
- Use `display_name` as the `name` field in `projects[]`. Store the original `project_name` as `raw_name` for internal reference only (omit from output JSON).
- In `domains[].skills[].projects[]`: store only the `id` strings — no other fields. Consumer looks up full data in `projects[]` by id.
- In `product_groups[].projects[]`: store `{ id, role, status }` only — no `display_name` field.

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
After deriving display names, group projects belonging to the same product/system:

**Grouping logic (apply both; either match triggers grouping):**
1. Projects sharing the same **parent directory path** → one product group
2. Projects whose `project_name` shares a **common prefix** after stripping role suffixes (`-web`, `-server`, `-nest-server`, `-docker`, `-backend`, `-frontend`, `-api`, `-cli`) → one product group

**For each group:**
- `product_name`: the shared functional name without role suffix (anonymized per display name rules)
- `projects`: array of members, each with `display_name`, `role` (Frontend / Backend / Backend NestJS / Docker / Infra / CLI), and `status`

Add a `product_groups` top-level array to both JSON files (after `tag_index`):

```jsonc
"product_groups": [
  {
    "product_name": "Lab Space & Rack Management",
    "project_count": 4,
    "roles": ["Frontend", "Backend (Laravel)", "Backend (NestJS)", "Docker / Infra"],
    "status": "Production",   // highest-priority status among members
    "projects": [
      { "id": "3a7f2c1b09e4", "role": "Frontend", "status": "Production" },
      { "id": "9f1bc234a5e7", "role": "Backend (Laravel)", "status": "Production" },
      { "id": "c82d0f6173ab", "role": "Backend (NestJS)", "status": "Production" },
      { "id": "7e45a912b0cf", "role": "Docker / Infra", "status": "Production" }
    ]
  }
]
```

Individual projects still appear in the `projects[]` array — `product_groups` is additive.

### Step 4: Build domain mapping
Use the domain → tags mapping from the generate-tech-profile skill (same mapping table).

For each tag in any project, assign it to a domain. A tag may belong to multiple domains.

### Step 5: Derive skill levels
For each (domain, tag) pair, collect **every** project that has this tag — no sampling, no truncation. Then:
- Set `projects` = the complete array of those project ids (strings only) — ALL of them
- Set `project_count` = `projects.length` exactly — this is the source of truth, not a separate estimate
- Derive `level` from `project_count` and the statuses of the matched projects:
  - `expert`: `project_count` ≥ 5, and ≥1 is Production or In Progress
  - `proficient`: `project_count` 2–4, or `project_count` = 1 with Production status
  - `familiar`: `project_count` = 1, status is Archived / Prototype / Completed only

### Step 6: Derive years_of_experience
Not derivable reliably from CLAUDE.md — use hardcoded value `8` (update manually if needed).

### Step 7: Build profile.summary and linkedin fields
Synthesize from all `技術亮點` texts:
- `profile.summary` (EN): 3–5 sentence paragraph covering top domains, key technologies, and scale
- `profile.summary` (ZH): same content in Traditional Chinese
- `linkedin.about` (EN): LinkedIn-optimized About section, 3–5 sentences, first-person, action verbs
- `linkedin.about` (ZH): LinkedIn「關於」欄位，繁體中文，3–5 句，第一人稱

### Step 8: Build linkedin.skills_list
Take all tags, sort by:
1. Tags appearing in `featured: true` projects first
2. Then by project_count descending
Take top 20.

### Step 9: Build linkedin.experience_highlights
For each domain with ≥3 projects, write one bullet:
- EN: First-person, action verb, mention key projects by name, include scale/impact if available
- ZH: 第一人稱，動作動詞，提及關鍵專案名稱，盡量帶規模與成果數字

### Step 10: Write split files
Write to `tech-profile/` under the current working directory:

1. `tech-profile/projects/<hash>.en.json` and `<hash>.zh.json` for each project (only new/changed ones on incremental runs)
2. `tech-profile/domains-en.json` and `domains-zh.json`
3. `tech-profile/tag-index-en.json` and `tag-index-zh.json`
4. `tech-profile/product-groups-en.json` and `product-groups-zh.json`
5. `tech-profile/meta.json` — include `id_map: { "<hash>": "<display_name_en>" }` for all projects

**`meta.json` structure:**
```jsonc
{
  "meta": { "generated_at", "source_version", "total_projects", "schema_version": "2.0", "lang": "en" },
  "profile": { ...same as before... },
  "linkedin": { ...same as before... },
  "id_map": {
    "3a7f2c1b09e4": "Lab Space & Rack Management — Frontend",
    ...
  }
}
```

Use 2-space indentation. Ensure valid JSON (no trailing commas, no comments).

### Step 11: Report results
```
✅ Tech profile JSON generated (split-file format)
- Projects: N total, M updated (skill_version: X.Y)
- Unique tags: T
- Domains: [frontend, backend, ai_llm, ...]
- tech-profile/ → <absolute path>
  ├── meta.json (id_map: N entries)
  ├── domains-{en,zh}.json
  ├── tag-index-{en,zh}.json
  ├── product-groups-{en,zh}.json
  └── projects/ (N×2 files)
```

---

## Domain IDs and Labels

| id | EN label | ZH label | icon |
|----|----------|----------|------|
| frontend | Frontend | 前端開發 | 🖥 |
| backend | Backend | 後端開發 | ⚙️ |
| ai_llm | AI / LLM | AI / 大型語言模型 | 🤖 |
| database | Database | 資料庫 | 🗄 |
| devops | DevOps / Infrastructure | DevOps / 基礎架構 | 🚀 |
| cloud | Cloud Services | 雲端服務 | ☁️ |
| mobile | Mobile | 行動應用 | 📱 |
| tools | Tools & Automation | 工具與自動化 | 🔧 |
| languages | Languages | 程式語言 | 💻 |
| other | Other | 其他 | 📦 |

### Cloud domain tags
Tags that belong to `cloud` (remove from `other`/`mobile`/`ai_llm` if present):
`Firebase`, `Firebase Admin`, `Firestore`, `Firebase FCM`, `Firebase Hosting`,
`Azure AD`, `Azure OpenAI`, `Azure Functions`,
`Google Cloud Storage`, `Google Maps`, `Google Sign-In`, `Gmail API`, `Google Maps Geocoding API`,
`Serverless`, `Self-Hosted`

## Status Translation

| EN | ZH | badge |
|----|----|-------|
| Production | 正式上線 | [P] |
| In Progress | 開發中 | [IP] |
| Maintenance | 維護中 | [M] |
| Side Project | 個人專案 | [S] |
| Archived | 已封存 | [A] |
| Prototype | 原型 | [Proto] |
| Completed | 已完成 | [C] |

## Notes
- Read CLAUDE.md files in parallel batches of up to 10
- Write project files in parallel batches; write index files after all projects are done
- Skip malformed CLAUDE.md files, log warning, continue
- EN file: translate all Chinese description/summary text into natural English
- ZH file: use `one_line_description` as-is; translate domain/status labels using tables above
- `featured: true` projects are marked with `"featured": true` in the JSON — do NOT add ⭐ emoji inside JSON strings
- Always overwrite index files (domains, tag-index, product-groups, meta) on each run; project files are only rewritten when changed
- The old `tech-profile-en.json` / `tech-profile-zh.json` monolith files are superseded by `tech-profile/` — do not generate them
- The `linkedin_about` field must be copy-paste ready — no placeholders, no markdown formatting, plain text only
- `tag_index` must be sorted by `project_count` descending
- `projects` array sorted by: status priority (Production first) then alphabetically by name
- `domains` array ordered per the domain IDs table above (frontend → backend → ai_llm → database → devops → cloud → mobile → tools → languages → other)
- **Privacy**: `display_name` must describe only system function — never a client, company, or brand name. This applies to ALL projects, not just those with `pa##`/`pt##` codes. Known sensitive names include: `enbg`, `qsquare`, `ltutor`, `uplusa`, `cmn`, `ses`, `pixis`, `atmos`, `alpha` (as brand), `cgu`, `qubear`, `wistron`. After deriving every display name, scan it for these tokens and re-derive from `one_line_description` if any are found. This rule applies everywhere in the JSON output including `projects[]`, `domains[].skills[].projects[]`, `product_groups[]`, and `linkedin.experience_highlights`.
- **Grouping**: `product_groups` is additive — individual projects still appear in `projects[]`. `product_groups` gives the consumer a product-level view for portfolio/resume rendering.
