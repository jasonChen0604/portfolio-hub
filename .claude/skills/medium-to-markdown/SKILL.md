---
name: medium-to-markdown
description: Converts a Medium article URL (Jason Chen's Medium only) into a blog post markdown file for this repo's content/blog/. Use when the user gives a Medium article link and asks to publish/import it as a blog post, or says things like "add this Medium post to the blog", "convert this Medium article to markdown".
---

# Medium → Markdown Blog Importer

Converts a Medium article into a single markdown file with YAML frontmatter,
written to `content/blog/<slug>.md`. This repo only publishes **Jason Chen's**
own Medium posts (`https://jason-chen-0604.medium.com`) — there is no
multi-author selection here. Blog posts are **single-language** — do not
translate the post, do not touch any i18n/translation files. This skill only
produces one file.

## Name-only input (no URL given)

If the user just says "check for new posts" / "jason" with no URL, resolve
straight to the profile and find what's not yet converted — don't ask for a
link:

- Profile: `https://jason-chen-0604.medium.com`

Steps:

1. Navigate to the profile URL with Playwright and scroll to the bottom
   (Medium profile lists lazy-load) so every story link loads. Collect each
   story's title + canonical URL (strip `?source=`/query params, keep the
   `.../slug-<id>` form) **and its listed date** — the profile feed shows a
   relative date ("3d ago", "Jul 12") next to each story card; grab that text
   node too (it's a `<span>`/`<time>` sibling near the title link, not always
   a real `<time datetime>`). Keep it as-is (relative or absolute), don't
   normalize it — it's just for the user to eyeball recency.
2. Collect already-converted `sourceUrl`s: `grep sourceUrl` across
   `content/blog/*.md`. Match by the trailing `-<id>` hex suffix (URLs can
   appear as either the `jason-chen-0604.medium.com` or `medium.com/@handle`
   form for the same post — the id suffix is the stable key).
3. Diff: profile stories minus already-converted ids = not-yet-converted
   list, newest first.
4. **Ask the user which to import with an interactive checklist**, not a
   plain-text list — call `AskUserQuestion` with `multiSelect: true`. Each
   option's `label` is the article title, `description` is its date (e.g.
   "3 days ago" / "Jul 12"). A question allows at most 4 options, so if there
   are more than 4 not-yet-converted articles, split into multiple questions
   (send several questions in one `AskUserQuestion` call — it supports 1-4
   questions per call, so e.g. up to 16 articles fit across 4 questions in a
   single call; batch further calls if there are even more). Do not fall
   back to a plain numbered-list text prompt — always use the checklist.
5. Once the user picks, run the normal Steps 1–8 below for each selected
   URL (use the batch-import guidance if more than one).

## Steps

1. **Fetch the article via Playwright MCP** (not `WebFetch` — Medium is JS-
   rendered and gates content behind client-side hydration, so a plain HTTP
   fetch often returns a paywall/stub shell instead of the real article).
   - `mcp__playwright__browser_navigate` to the given Medium URL.
   - `mcp__playwright__browser_evaluate` to pull the article's DOM directly:
     grab `document.querySelector('article')` (fall back to `main` if no
     `<article>`), and read its `innerHTML`. Also grab the page `<title>`,
     a `<time>` element's `datetime` attribute for the published date, and
     the Topic tag chips (the row of pill-shaped links/buttons above the
     title, each `aria-label="Topic: <name>"` — grab all of their visible
     text as the tag list).
   - If the page shows a "Sign up / Sign in to continue reading" gate with
     truncated content, note that in your final report — do not fabricate
     the missing tail of the article.

2. **Convert the fetched DOM to clean Markdown.**
   - Walk the `article`/`main` HTML structurally (headings, `<p>`, `<ul>`/
     `<ol>`/`<li>`, `<pre>`/`<code>`, `<blockquote>`, `<a>`, `<img>`,
     `<strong>`/`<em>`) rather than re-summarizing prose — this is a DOM→MD
     transcription, not a rewrite. Preserve code block language from a
     `class="language-*"` attribute when present. **Not all code is a gist** —
     many posts put code in plain `<pre>`/`<code>` blocks inline (no iframe);
     transcribe those directly. Gists (below) are a *separate* case, not the
     only source of code.
   - **Prefer an event-stream converter over rebuilding a DOM tree.** Medium's
     `innerHTML` has deeply nested `<div>`s with obfuscated classes and the
     occasional stray/mismatched tag. A hand-rolled tree-builder that pops the
     stack on every end-tag will, on one mismatch, silently drop everything
     after it — you get a file that ends mid-article with no error. A linear
     pass over `HTMLParser` start/end/data events, emitting block strings as
     you go and maintaining a small inline-format stack, has no tree to
     corrupt and does not truncate. stdlib `html.parser` is enough — do not
     add `bs4`/`html2text`. Skip `<svg>/<button>/<input>/<label>` and
     `role="button"` chip subtrees via a depth counter, treat
     `h1-6/p/pre/blockquote/li` as block boundaries, and flush the inline
     buffer at each boundary.
   - **Keep content `<img>`s as remote links, never download/copy the
     asset bytes into this repo** — the images are the original author's
     media, not ours to re-host. For each `<img>` in the article body
     (skip author avatars/icons, excluded by the chrome-stripping pass
     below), take the highest-res URL available (prefer a `srcset`/
     `data-testid="og"` `<source>` entry over the base `<img src>`, picking
     the widest `w` descriptor) and use that URL directly in the converted
     `![alt](url)` Markdown. Hotlinking is safe here — `<img src>` isn't
     subject to CORS, only pixel-level JS/canvas access is; the actual risk
     is the source disappearing or changing later, which is an acceptable
     tradeoff against copying someone else's asset onto our domain.
   - The **first content image** (in document order, if any) also becomes
     `coverImageUrl` in frontmatter (step 3) — same remote URL, used to
     render a thumbnail on the blog list page.
   - Strip Medium chrome by DOM signature before converting: clap-count
     buttons, "Follow" links/buttons, member-only banners, the author bio
     card (usually a `<section>` right after the article body containing the
     author avatar + name again), "More from ..." / related-article lists,
     response/comment count links, embedded newsletter-signup prompts. These
     live outside `article` content in most cases — if any leak in from
     `innerHTML`, cut them by their recognizable class/text rather than by
     truncating good content.
   - **Chrome that reliably leaks into `article.innerHTML` and how to cut it**
     (all observed, not hypothetical):
     - **The header byline line** `<author link> · N min read · X ago` — drop
       any short (<90 char) block matching `min read` / `days? ago` /
       `hours? ago`. It also poisons the excerpt if left in.
     - **Image zoom wrapper text** "Press enter or click to view image in full
       size" — a `<span>` inside the figure's `role="button"` zoom layer. Filter
       blocks containing `full size` / `Press enter or click`.
     - **The trailing newsletter card** "Get Jason's stories in your inbox" /
       "Join Medium for free to get updates" — cut from that marker to end.
     - **`role="button"` is overloaded**: it wraps *both* the topic chips (skip
       — `aria-label` starts `Topic:`) *and* the inline image zoom layer that
       contains the real `<img>` (do NOT skip, or you lose the image). Skip only
       the `Topic:` ones by `aria-label`, not every `role="button"`.
     - Keep the author's own signature block (GitHub/Portfolio/LinkedIn links
       at the article foot) — that's real article content, not Medium chrome.
   - **Rewrite in-article relative links to absolute.** Medium series
     cross-links render as root-relative hrefs (`/some-other-post-<id>`).
     Left as-is they 404 on our domain. Prefix them with
     `https://jason-chen-0604.medium.com` so they resolve. Also strip
     `?source=`/`?sharedUserId=` tracking from every link href.
   - **Recover embedded GitHub Gists (tables/code) that lazy-load.** Medium
     renders a gist as a `<figure>` wrapping an `<iframe title="*.md">` whose
     `src` is a same-origin media proxy
     (`https://jason-chen-0604.medium.com/media/<id>`). These are lazy-loaded:
     on first read the `<figure>` is empty and the iframe has no `src`, so a
     structural DOM walk silently drops the content (a heading with nothing
     under it is the tell). To recover it: `scrollIntoView()` the surrounding
     heading/figure to trigger hydration, then re-query — the iframe now has
     its `src`. Because the proxy iframe is **same-origin**, read
     `iframe.contentDocument` directly and convert its `<table>`/`<pre>` to
     Markdown (a gist table → a Markdown table). The rendered gist page also
     exposes the canonical `gist.github.com/.../raw/...` URL if you'd rather
     fetch the source. Only fall back to a screenshot if the embed turns out
     to be cross-origin and its DOM can't be read.
   - Normalize headings so the article body starts at `##` (the page
     renders the frontmatter `title` as the single `<h1>`) — demote any
     in-article `#`/H1 to `##` and shift the rest down one level to match.
     **Do not re-emit the title as an `##` heading at the top of the body** —
     every existing post in `content/blog/` starts straight into the italic
     subtitle line, never repeats the frontmatter `title` as a heading. Section
     headings inside the body (TL;DR, etc.) are `##`, not `###` — this only
     goes wrong if you mistakenly emit the title heading first and then treat
     the real first in-article heading as one level deeper.
   - **Real `<table>` elements convert to real Markdown tables**, not code
     fences — `| Col A | Col B |` header row, `|---|---|` separator, one `| ... |`
     row per `<tr>`. This is what every existing table in `content/blog/*.md`
     looks like (see `## Under the Hood` in e.g.
     `rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager.md`). This
     applies to actual `<table>` markup — gist-embedded tables (recovered below)
     and inline HTML `<table>`s alike. It does **not** apply to a `<pre>` block
     that happens to contain hand-drawn ASCII-art box-drawing characters
     (`+---+---+`) — that's the author's own preformatted text, not a table
     element, and must stay verbatim inside a code fence exactly as authored.

   - **Match the exact body-opening structure every existing post uses**,
     in this order, each separated by a blank line:
     1. *No repeated title heading* — the body starts directly at the next
        element below, never with `## <title>`.
     2. The subtitle line, italic: `*<subtitle text>*` (the article's dek/
        deck line — often the same text used as the frontmatter `excerpt`
        source, sometimes prefixed `k3s Series #7 — ...`-style if the
        original page showed it that way inline).
     3. The cover image, plain (no alt text): `![](<coverImageUrl>)` — the
        same URL written to frontmatter `coverImageUrl`. Omit this line if
        the article has no content image at all.
     4. Optionally, an italic image caption on its own line if Medium
        rendered one under the hero image: `*<caption text>*`. Omit if none.
     5. **If the post belongs to a series**, the series-nav line, wrapped in
        a `>` blockquote, following the exact sentence pattern from existing
        posts:
        `> This is Part N of "<Series Title>" Previous: [Part N-1 — <title>](<url>) ｜ Series overview: [<Series Title> — Series Overview](<overview url>) ｜ Next: [Part N+1 — <title>](<url>)`
        - Use the full-width `｜` separator between segments, matching
          existing posts byte-for-byte.
        - Omit the `Previous:` segment only for part 1 (first post in the
          series). Omit `Next:` (replace with `Next: none — this is the last
          part`) only for the final post. Every other post gets all three
          segments.
        - The blockquote wrapper (`> `) is the norm — use it. (A couple of
          early posts in the k3s series predate this convention and lack the
          `>`, but new imports should always use it.)
     Everything from step 3 onward (TL;DR, etc.) follows as normal `##`
     sections after this opening block.

3. **Determine metadata.**
   - `title`: the article's headline (the `<h1>` inside `article`, falling
     back to the page `<title>` with any " | Medium" suffix stripped).
   - `publishedAt`: the `datetime` attribute off the `<time>` element grabbed
     in step 1, normalized to `YYYY-MM-DD`. If Medium doesn't expose one, use
     today's date.
   - `author`: always `"Jason Chen"` — this repo only imports his own
     Medium posts. No byline matching/disambiguation needed.
   - `slug`: kebab-case of the title (lowercase, spaces → `-`, strip
     punctuation). If a file with that slug already exists in
     `content/blog/`, append `-2`, `-3`, etc.
   - `excerpt`: first ~160 characters of the body's plain text (no
     markdown syntax), trimmed at a word boundary, no trailing ellipsis
     required but fine to add one if truncated mid-sentence.
   - `tags`: the Topic chip labels captured in step 1, as a YAML string
     array in their original order. Omit the field entirely if Medium
     exposed no topic chips — don't invent tags.
   - `sourceUrl`: the canonical Medium URL for the article (the current
     page URL after navigation, with tracking query params like
     `?sharedUserId=...`/`?source=...` stripped).
   - `coverImageUrl`: the remote URL of the first content image from step 2
     (not downloaded — same hotlink URL used in the body). Omit if the
     article has no images.
   - `series`: only set `{ name: "...", part: N }` if the article is
     explicitly part of a numbered series (matches an existing `series.name`
     in other `content/blog/*.md` files, or the user says so). Otherwise omit
     — most standalone posts have no series.

4. **Write the file** to `content/blog/<slug>.md` with this exact
   frontmatter shape:

   ```yaml
   ---
   title: "..."
   slug: "..."
   author: "Jason Chen"
   publishedAt: "2026-07-11"
   excerpt: "..."
   tags: ["Topic One", "Topic Two"]
   sourceUrl: "https://jason-chen-0604.medium.com/slug-abc123"
   coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/..."
   ---

   (converted markdown body starts here)
   ```

   Add a `series: { name: "...", part: N }` line only when step 3 determined
   this post belongs to a series. Quote all frontmatter string values so
   titles/excerpts containing `:` or other YAML-sensitive characters parse
   correctly. Omit `tags`, `sourceUrl`, and/or `coverImageUrl` entirely
   (don't write empty placeholders) if that data wasn't available.

5. **Do not** register the post anywhere else. `getAllPosts()`/
   `getPostBySlug()` in `lib/blog/posts.ts` discover posts directly from
   `content/blog/` at build time — no other file needs touching.

6. **Verify the written file against the original with Playwright before
   reporting.** Lazy-loaded embeds (especially GitHub Gist tables — see step
   2) are silently dropped unless every one has been hydrated, and a single
   Medium article often contains *several* gist tables at different sections.
   After writing the `.md`:
   - Scroll the whole article top-to-bottom in the Playwright page (step by
     step, e.g. `window.scrollTo` in a loop with small waits) so **all** lazy
     iframes hydrate, then enumerate every `iframe[src*="/media/"]` — that is
     the authoritative count of embedded gists.
   - For each embed, read its same-origin `contentDocument` and compare its
     table against the written `.md`: same number of tables, same rows/columns,
     same cell text. Also sanity-check the prose (headings, list items) so
     nothing was truncated.
   - If anything is missing or mismatched — a table that never rendered, an
     empty heading where a table belongs, a dropped section — **fix the `.md`
     until it fully matches the original**, then re-verify. Do not report
     "done" while the file is still incomplete.
   - **Cheap truncation check by keyword.** Pick a few landmark strings that
     appear late in the original (a numbered step, the last `<h2>`, a
     closing-section phrase) and `grep` them in the written `.md`. A
     truncation bug shows up instantly as a missing landmark — much faster
     than eyeballing 12KB. This is the check that catches the tree-rebuild
     silent drop from step 2.

7. **Build to confirm the post(s) generate, then verify rendered output.**
   - Run `pnpm build`. If it fails with unrelated stale-cache errors, that's
     `.next`, **not your change** — `rm -rf .next` and rebuild. Confirm
     `git status` shows only your new `content/blog/*.md` before blaming the
     build.
   - After a clean build, confirm the page(s) exist under
     `out/blog/<slug>/index.html`, the new title appears on `out/blog/
     index.html` (the list page). Spot-check one rendered `index.html`: strip
     tags and word-count it, count `<pre>` blocks and `miro.medium` images
     against the source so you know nothing dropped between `.md` and
     rendered HTML.

8. Report back the file path(s) written and a one-line summary of title/
   slug/date/tags/sourceUrl per post, plus the count of tables/embeds/code-
   blocks verified and confirmation the build generated the page(s), so the
   user can spot-check before it's committed.

## Batch imports (multiple URLs at once)

When given several Medium URLs together:
- **Playwright is a single shared tab** — process the fetch step serially
  (navigate → scroll/hydrate → dump `article` DOM to a scratchpad JSON file per
  article), one at a time. Do not spawn parallel subagents that each drive the
  browser; they fight over the same tab.
- The DOM→Markdown *conversion* is pure text work with no browser — once every
  article's DOM is dumped to disk, converting all of them is one reusable script
  run over each JSON (same converter, per-article tags/date args). This is where
  batching pays off; keep the converter in the scratchpad, not the repo.
- For a **series**, the posts cross-link each other. Give each a sensible
  `publishedAt` in series order (Medium rarely exposes a real `datetime`), and
  remember the relative-link rewrite (step 2) is what keeps the "Previous / Next"
  links from 404-ing.
- Build once at the end (all posts together), not per-post.
