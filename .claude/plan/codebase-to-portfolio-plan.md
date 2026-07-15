# Plan: Public AI-Agent Skills Plugin — Dev Portfolio Pipeline (new repo)

## Context

Jason 目前有一條 6-skill 的作品集 pipeline（分散在 `~/.claude/skills/init-claude-md/` 與
`~/project/personal-home-page/.claude/skills/` 下的 5 個 skill）：掃描本機所有專案 →
為每個專案產生 CLAUDE.md 作品集文件 → 聚合成雙語 tech profile（Markdown + 分割式 JSON），
最終驅動個人作品集網站。

目標：抽出這條 pipeline 到一個**新的 public GitHub repo**，打包為 Claude Code plugin，
並以開放的 SKILL.md（Agent Skills）格式讓 Codex / Copilot / Cursor 等其他 AI 工具也能使用。
動機：累積個人作品集與公開 repo star 數。由 Sonnet 執行本計劃。

已與使用者確認的決策：
- **範圍**：僅 pipeline 6 個 skill（scan-projects, init-claude-md, batch-init-claude-md,
  get-latest-version, generate-tech-profile, generate-tech-profile-json）
- **語言**：README / SKILL.md 全英文；skill 輸出語言改為 config 可設定（預設 en，支援 zh-TW）
- **跨工具**：v1 就要實際支援 Claude Code 以外的 AI 工具（Codex / Copilot / Cursor），
  不能只靠 README 說明 — 需提供各工具可直接使用的格式
- **Repo 名稱**：`codebase-to-portfolio`（已定案）

Plugin `name`（kebab-case，決定 skill namespace）：**`codebase-to-portfolio`**，
skill 呼叫如 `/codebase-to-portfolio:scan-projects`。

## 新 Repo 結構

```
codebase-to-portfolio/
├── .claude-plugin/
│   ├── plugin.json            # name: "codebase-to-portfolio", version, author, keywords, license
│   └── marketplace.json       # 自架 marketplace，讓使用者 /plugin marketplace add <owner>/<repo>
├── skills/                    # 單一事實來源（SKILL.md 純 Markdown 指令）
│   ├── scan-projects/SKILL.md
│   ├── init-project-doc/      # 由 init-claude-md 改名（避免 Claude 專屬詞，產出檔名可設定）
│   │   ├── SKILL.md
│   │   └── template.md        # 英文化的專案文件模板（去除個人資訊）
│   ├── batch-init/SKILL.md
│   ├── get-latest-version/SKILL.md
│   ├── generate-tech-profile/SKILL.md
│   └── generate-tech-profile-json/SKILL.md
├── adapters/                  # 跨工具支援層（由 script 從 skills/ 生成，勿手改）
│   ├── codex/                 # OpenAI Codex CLI：custom prompts（~/.codex/prompts/*.md）+ AGENTS.md 片段
│   ├── copilot/               # GitHub Copilot：.github/prompts/*.prompt.md + copilot-instructions.md 片段
│   └── cursor/                # Cursor：.cursor/rules/*.mdc
├── scripts/
│   └── build-adapters.sh      # 從 skills/*/SKILL.md 轉出三種 adapter 格式（frontmatter 轉換 + 內容照搬）
├── examples/
│   ├── profile.config.example.json
│   ├── projects-list.example.md
│   └── tech-profile-output/   # 一份去識別化的實際輸出範例（meta.json、domains-en.json 節錄）
├── docs/                      # 全英文，v1 不做中文版
│   ├── installation.md        # 各家工具安裝與使用方式（見「跨工具支援」節）
│   ├── configuration.md       # profile.config.json 完整欄位說明
│   ├── pipeline.md            # 6 個 skill 的流程、輸入輸出、執行順序
│   └── json-schema.md         # tech-profile/ JSON 格式契約（從 personal-home-page CLAUDE.md 的契約表移植、英文化）
├── README.md                  # 英文：賣點、pipeline 圖、快速開始、連到 docs/
├── LICENSE                    # MIT
└── CHANGELOG.md
```

## 跨工具支援（v1 必做）

原則：`skills/` 的 SKILL.md 是單一事實來源；`scripts/build-adapters.sh` 把每個 skill
轉成各工具的原生格式放進 `adapters/`（skill 內容本質是純 Markdown 指令，轉換只是
frontmatter/檔名/放置位置的差異）。**執行第一步 Sonnet 必須先 web search 查證各工具
2026 當下的自訂指令格式**（背景查證 agent 無法上網，以下為計劃時的已知格式，以查證結果為準）：

| 工具 | 格式 | 使用者安裝方式（寫進 docs/installation.md） |
|---|---|---|
| Claude Code | plugin + SKILL.md | `/plugin marketplace add <owner>/codebase-to-portfolio` → install |
| OpenAI Codex CLI | custom prompts / AGENTS.md | `cp adapters/codex/*.md ~/.codex/prompts/`，以 `/prompt-name` 呼叫 |
| GitHub Copilot (VS Code) | `.github/prompts/*.prompt.md` | 複製到工作區 `.github/prompts/`，以 `/prompt-name` 呼叫 |
| Cursor | `.cursor/rules/*.mdc` 或手動附加 | 複製到專案 `.cursor/rules/`，或以 @-file 引用 |
| 其他任意 agent | 純 Markdown | docs 說明可直接把 SKILL.md 內容貼為 prompt |

注意：pipeline 中 `batch-init` 會 spawn agent CLI 子程序，config 的 `agent_command`
需給出各工具對應範例（`claude -p`、`codex exec` 等，以查證為準）。

關鍵格式規則（已向 claude-code-guide 查證）：
- 只有 `plugin.json` / `marketplace.json` 放 `.claude-plugin/`，`skills/` 等目錄放 repo root
- SKILL.md frontmatter：`name`（缺省用資料夾名）、`description`（觸發判斷依據，必填）、
  可選 `allowed-tools`、`disable-model-invocation`
- Plugin skill 安裝後 namespace 為 `/plugin-name:skill-name`
- marketplace.json 必填：`name`、`owner.name`、`plugins[]`（每項必填 `name` + `source`，
  source 可用 `"./"` 相對路徑指向同 repo）
- 參考文件：https://code.claude.com/docs/en/plugins-reference.md 、plugin-marketplaces.md

## 核心工作：去個人化（本計劃真正的工作量所在）

現有 skill 充滿 Jason 專屬硬編碼，移植時必須全部抽到 **`profile.config.json`**（使用者放在
執行目錄，skill 讀不到時給出友善錯誤 + 指向 example）：

| 硬編碼項目 | 所在 skill | 處理方式 |
|---|---|---|
| `~/` → `/Users/jason/` 展開 | batch-init、兩個 tech-profile | 改用可攜的 `$HOME` 處理 |
| 身分資料（name "Jason Chen"、email、github `jasonChen0604`、linkedin、title、years_of_experience=8） | init-claude-md/config.json、generate-tech-profile-json | 全部移入 config：`profile.name/email/github/linkedin/title/years_of_experience` |
| 隱私 blocklist（enbg、wistron 等真實客戶名） | 兩個 tech-profile skill | config `privacy_blocklist: []`，預設空陣列；SKILL.md 說明用途，example 給假名示範 |
| 繁中為主輸出、`+08:00` 時區 | 全部 | config `languages: ["en"]`（可加 zh-TW 等）、`timezone` |
| 預設掃描根目錄 `~/project` | scan-projects | config `scan_root`，或指令參數覆蓋 |
| domain→tag 對照表、EN↔ZH 翻譯表 | 兩個 tech-profile skill | 保留為 skill 內建預設（是產品價值的一部分），config 允許 `custom_domains` 擴充 |
| `init-all.sh` 懸空引用 | scan-projects | 刪除該引用 |
| `claude --dangerously-skip-permissions -p "/init-claude-md"` 子程序 | batch-init | 改為 config `agent_command`（預設 claude CLI，文件註明風險與其他 CLI 替代寫法） |
| 模板 footer 引用 `~/.claude/skills/init-claude-md/template.md` | init-claude-md/template.md | 改為引用 plugin 內相對路徑 |
| skill 產出檔名 `CLAUDE.md` | init-claude-md、下游全部 | config `doc_filename`（預設 `CLAUDE.md`，可設 `AGENTS.md` 供 Codex 等工具直接受益）— 下游 skill 讀同一 config 保持一致 |

## SKILL.md 內容改寫原則

- 全英文重寫（trigger phrases 保留中英雙語 trigger，擴大觸發面）
- 每個 SKILL.md 開頭統一一段 "Read `profile.config.json` from cwd; if missing, tell the
  user to copy `examples/profile.config.example.json`" 的共用約定
- `get-latest-version` 標記 `disable-model-invocation: true`（純 sub-skill）
- 保留現有 pipeline 邏輯（增量更新、SHA-256 project id、split-file JSON schema v2.0）不動——
  只做去個人化與英文化，不重新設計演算法

## 文檔（v1 必做、全英文）

- **README.md**：一句話賣點（"Turn your entire codebase history into a portfolio-ready
  tech profile — with any AI coding agent."）、mermaid pipeline 圖、快速開始（Claude Code
  三行安裝 + 跑一次 demo）、輸出範例截圖、連到 docs/、showcase 連結（Jason 的 portfolio 網站）
- **docs/installation.md**：上表五種工具各自完整的安裝 + 呼叫方式，含 batch-init 的
  `agent_command` 各工具範例
- **docs/configuration.md**：`profile.config.json` 每個欄位的型別、預設值、範例
- **docs/pipeline.md**：6 個 skill 的職責、輸入/輸出檔案、建議執行順序、增量更新行為
- **docs/json-schema.md**：`tech-profile/` 輸出的欄位契約與枚舉值（給要拿 JSON 蓋網站的人）
- GitHub topics：`claude-code`, `claude-plugin`, `agent-skills`, `ai-agents`, `portfolio`,
  `developer-tools`, `codex`, `github-copilot`, `cursor`

## 執行階段

1. **查證跨工具格式**：web search 確認 Codex / Copilot / Cursor 當下的自訂 prompt/rule 格式與呼叫方式
2. **建 repo + scaffold**：GitHub 新 public repo `codebase-to-portfolio`、plugin.json、marketplace.json、LICENSE(MIT)、目錄骨架
3. **移植 + 去個人化 6 個 skill**：依上表逐項處理；來源檔在
   `~/.claude/skills/init-claude-md/` 與 `~/project/personal-home-page/.claude/skills/`
4. **Config 層**：定義 `profile.config.example.json` schema，六個 skill 統一讀取約定
5. **Adapter 層**：寫 `scripts/build-adapters.sh`，生成 `adapters/{codex,copilot,cursor}/`
6. **examples/ + docs/ 四份文件 + README**
7. **驗證**（見下節）
8. **發佈**：push、加 topics、（可選）提交 anthropics/claude-plugins-community 官方社群 marketplace 增加曝光

## 驗證方式

1. `claude plugin validate` 通過
2. 乾淨 Claude Code session 執行 `/plugin marketplace add <repo>` + install，確認 6 個 skill
   以 `/codebase-to-portfolio:*` namespace 出現
3. 建 fixture 目錄（2–3 個假專案，含 package.json/Dockerfile 等 marker），配一份假的
   `profile.config.json`，跑完整 pipeline：scan-projects → batch-init → generate-tech-profile-json，
   確認 projects-list.md、各專案 doc、`tech-profile/` 全部正確產出
4. 產出的 JSON 用 personal-home-page 的 `lib/data/types.ts` 型別契約驗證（欄位相容 =
   Jason 自己的網站可直接當 showcase 消費此 plugin 的輸出）
5. 至少一個非 Claude 工具實測：把 `adapters/codex/`（或 copilot）裝進對應工具，跑
   `scan-projects` 確認指令可被理解執行（若本機無該工具，至少人工檢查 adapter 檔案格式
   與該工具文件一致）
6. 全 repo grep 確認無 `jason`、真實 email、客戶名（enbg/wistron/…）等個人資訊殘留
   （plugin.json 的 author 欄位除外——那是刻意署名）

## 不做的事（v1 範圍外）

- MCP server 包裝 — 另一種跨工具路線，v2 再評估
- 中文版文檔 — 先英文，之後視需求加
- code-reviewer / debug-helper 等通用 skill — 不在本 plugin 定位內
