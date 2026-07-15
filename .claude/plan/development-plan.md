# 開發計劃 — Personal Home Page

> 供後續開發 session（Sonnet）執行。每個里程碑獨立、按順序做完再開下一個。
> 規劃日期：2026-07-03。專案背景見 `CLAUDE.md`（含 tech-profile JSON 格式契約，異動 JSON 必須同步 `lib/data/types.ts`）。

## 總體方向

- **定位**：求職門面優先，技術展示其次。目標讀者是招募者／客戶。
- **節奏**：使用者每週投入幾小時，計劃按小顆粒任務切分，每個任務可在一次 session 內完成並部署。
- **驗收通則**：每個任務完成後 `pnpm check` 與 `pnpm build` 必須通過；涉及 UI 的改動需在 light/dark 兩模式與 en/zh 兩語言下目視確認。
- **明確不做**：雙向全自動平台同步（LinkedIn/104 無公開寫入 API）、CMS 後台、伺服器端渲染、新增重型前端依賴（D3 等）。

---

## 里程碑 0 — 收尾（預估 1 小時）

現況已調查（2026-07-03）：

- `app/experience/` 是**刻意保留**的舊網址 redirect stub（`/experience` → `/product`、`/experience/[slug]` → `/product/[slug]`），**保留，不要刪**。
- `components/experience/` 是 rename 後遺留的死碼，`grep` 確認無任何 import，**整個目錄刪除**。
- 三個未 commit 修改皆為合理改動，直接 commit：
  - `.claude/skills/generate-tech-profile-json/SKILL.md`：新增 cloud domain 與其 tag 清單
  - `components/skills/SkillsClient.tsx`：錨點捲動 offset 8 → 48
  - `firebase.json`：`cleanUrls: true` + rewrite 改指向 `/404.html`

### 任務

1. 刪除 `components/experience/` 目錄
2. `pnpm check && pnpm build` 確認通過
3. 分兩個 commit（Conventional Commits）：
   - `fix(skills): adjust anchor scroll offset and firebase clean URLs`（SkillsClient + firebase.json）
   - `docs(skills): add cloud domain to generate-tech-profile-json`（SKILL.md）＋ 死碼刪除可併入 `refactor(product): remove leftover experience components`
4. 部署驗證：`pnpm deploy:firebase` 後確認 `/experience` 舊網址仍正確轉到 `/product`，且 cleanUrls 下各頁面可直接存取

---

## 里程碑 1 — 整體質感（預估 3-4 個 session）

目標：招募者第一眼的專業感。**不改資料層、不加依賴**，全部在 MUI Joy theme 與現有元件內完成。

### 1.1 Theme 層統一（先做，後續任務都依賴它）

- 在 `components/providers.tsx` 的 CssVarsProvider 內建立 `extendTheme` 設定（若已有則集中化）：
  - 字型階層：標題/內文字級、行高、字重統一定義
  - 間距節奏：頁面區塊間距用固定 scale（如 4/8 的倍數）
  - 色彩：主色調在 light/dark 各自校準，確保對比度（WCAG AA）
- 驗收：全站無元件內 hardcode 的 fontSize/color 魔術數字（掃 `sx={{ fontSize:`、`color: "#` 類的散落值，收斂到 theme token）

### 1.2 Hero 區塊重設計（`components/home/`）

- 首屏內容：姓名、title、一句話定位（取自 `meta.json` 的 `profile.summary` 精簡版）、兩個 CTA：
  - 「View Products」→ `/product`
  - 「Contact」→ mailto（`profile.email`）
- 加入關鍵數字帶（years_of_experience、total_projects — 皆來自 `meta.json`，不可 hardcode）
- 排版在手機（375px）與桌機皆需檢查

### 1.3 卡片與列表打磨

- `components/product/ProductGroupCard.tsx`：狀態 badge 配色統一（Production/Completed/In Progress/Archived 四種，對照 CLAUDE.md 枚舉）、hover 效果、卡片陰影/邊框在 dark mode 下的層次
- `components/skills/SkillsClient.tsx`：skill level 三級（expert/proficient/familiar）的視覺差異要一眼可辨
- `components/layout/Footer.tsx`：補上 email、社群連結（資料源 `meta.json`）

### 1.4 收尾檢查

- 兩語言 × 兩主題 = 4 種組合全頁面過一遍
- commit + 部署

---

## 里程碑 2 — 履歷資料層 + SEO（預估 3 個 session）

### 2.1 resume JSON 資料層

- 新增 `tech-profile/resume-en.json` 與 `tech-profile/resume-zh.json`，結構：

```jsonc
{
  "work_experience": [
    {
      "company": "…",          // 公司名（依 CLAUDE.md 隱私規則，敏感客戶名不得出現）
      "title": "…",
      "start": "YYYY-MM",
      "end": "YYYY-MM | null",  // null = 至今
      "summary": "…",
      "highlights": ["…"]
    }
  ],
  "education": [
    { "school": "…", "degree": "…", "start": "YYYY-MM", "end": "YYYY-MM" }
  ],
  "certifications": [
    { "name": "…", "issuer": "…", "date": "YYYY-MM" }
  ]
}
```

- 同步更新 `lib/data/types.ts`（新增 `Resume` 介面）與 `lib/data/loaders.ts`（`resumeData: { en, zh }`）
- **初始內容由使用者提供**：session 開始時請使用者貼上 LinkedIn/104 現有經歷文字，協助轉成上述 JSON。資料不齊時欄位留空陣列，不要捏造。
- 同步更新 `CLAUDE.md` 的「必要欄位對照表」加入 resume 檔案

### 2.2 履歷區塊 UI

- 放在 `/about` 頁（不新開 route）：工作經歷 timeline、學歷、證照三區塊
- 元件放 `components/about/`，遵循現有 Client Component + 頁面層傳 props 模式
- 空陣列的區塊整段不渲染

### 2.3 SEO 基礎建設

- 每頁 `metadata`：確認 title/description/openGraph 完整（`app/*/page.tsx`；product 頁已有，補齊其餘頁面）
- OG image：靜態一張 `public/og.png`（1200×630），在 root layout metadata 註冊即可，不做動態產生
- `app/sitemap.ts`：用 Next.js 內建 sitemap 支援，route 清單含 `getAllSlugs()` 的動態頁（靜態匯出下會輸出 `sitemap.xml`）
- `public/robots.txt`：允許全站 + sitemap 位址
- `<html lang>`：靜態匯出無法隨 client 語言切換 SSR 值，維持 `lang="zh-Hant"` 或 `en` 擇一即可，不做複雜處理

---

## 里程碑 3 — LinkedIn / 104 半自動同步 Skill（預估 2 個 session）

LinkedIn 與 104 皆無公開寫入 API，**不做瀏覽器自動化**（維護成本高、易被平台封鎖）。做半自動：skill 產出可直接貼上的文字。

### 3.1 新 skill：`.claude/skills/sync-resume-platforms/SKILL.md`

- **正向（JSON → 平台）**：讀 `tech-profile/resume-*.json` 與 `meta.json` 的 `linkedin` 區塊，輸出：
  - LinkedIn 用（英文）：About、每段 Experience、Skills 清單，各欄位分段標示可直接複製
  - 104 用（繁中）：自傳、工作經歷各欄位
- **反向（平台 → JSON）**：使用者貼上平台現有內容，skill 解析後與現有 JSON diff，列出差異，經使用者確認後更新 JSON
- 觸發詞：「sync resume」、「更新 LinkedIn」、「更新 104」、「同步履歷」
- 參考現有 `.claude/skills/generate-tech-profile-json/SKILL.md` 的撰寫風格與隱私規則（敏感客戶名清單同樣適用）

### 3.2 驗證

- 用真實 resume JSON 跑一次正向輸出，使用者實際貼上平台確認格式可用

---

## 里程碑 4 — 互動技能視覺化（最後做）

前置：里程碑 1 完成。把 `/skills` 頁升級為主打技術亮點。

### 方向

- 用 **原生 SVG + React**（不引入 D3/vis.js 等依賴）做 domain ↔ project 關係視覺化
- 資料已齊備：`domains-*.json` 有 `skills[].projects[]` 對應、`tag-index-*.json` 有 tag 與專案的映射
- 建議形式（實作時再與使用者確認一種）：
  1. 可展開的技能樹：domain → skill → 關聯專案（點擊跳 `/product/[slug]`）
  2. 雷達圖：各 domain 的 project_count 分佈（SVG polygon，約 50 行內可完成）
- 需求：手機可用（互動 fallback 為點擊，不依賴 hover）、dark mode 配色、動畫用 CSS transition 不用動畫庫

---

## 給執行者（Sonnet）的注意事項

1. **每次 session 開頭讀本檔 + `CLAUDE.md`**，找到目前進行中的里程碑（見下方進度表）。
2. **格式契約**：動 `tech-profile/` JSON 必動 `lib/data/types.ts`，反之亦然。
3. **完成一個任務就 commit**（Conventional Commits），里程碑完成後 `pnpm deploy:firebase` 部署並請使用者驗收。
4. **不要擅自加依賴**。現有依賴（MUI Joy、emotion）足夠涵蓋所有里程碑。
5. **內容真實性**：所有數字與經歷來自 JSON 或使用者提供，禁止捏造填充。
6. 完成任務後更新下方進度表。

## 進度表

| 里程碑 | 狀態 | 完成日 |
|--------|------|--------|
| 0 收尾 | ✅ 完成 | 2026-07-15 |
| 1 整體質感 | 🔄 進行中（待使用者 4 組合視覺確認） | |
| 2 履歷資料層 + SEO | ✅ 完成 | 2026-07-15 |
| 3 同步 Skill | ⬜ 未開始 | |
| 4 互動視覺化 | ⬜ 未開始 | |
