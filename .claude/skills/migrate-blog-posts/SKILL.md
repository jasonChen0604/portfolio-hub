---
name: migrate-blog-posts
description: Copy new Jason Chen blog posts from the tool_project repo's blog source into this site's content/blog/. Triggers when the user says "migrate blog posts", "sync blog posts", "pull new blog posts", "更新部落格文章", or "搬遷文章".
---

# Migrate Blog Posts Skill

## Goal
Pull newly-written blog posts authored by Jason Chen from
`~/project/tool_project/src/app/[locale]/blog/posts/` into this repo's
`content/blog/`, without touching posts by other authors.

## Source of truth
- Source dir: `~/project/tool_project/src/app/[locale]/blog/posts/*.md`
- Each post is a single Markdown file with frontmatter: `title`, `slug`,
  `author`, `publishedAt`, `excerpt`, `tags`, optional `sourceUrl`,
  `coverImageUrl`.
- Only migrate files where `author: "Jason Chen"`.

## Execution steps

1. List `.md` files in the source dir and diff filenames against
   `content/blog/` in this repo to find files that don't exist here yet
   (new posts) — do not touch files that already exist unless the user
   explicitly asks to re-sync/overwrite one.
2. For each new file, grep its frontmatter for `author: "Jason Chen"`.
   Skip anything else (e.g. other authors on that blog).
3. Copy the matching files as-is into `content/blog/` (no transformation
   needed — same frontmatter schema is consumed by `lib/blog/posts.ts`).
4. Run `pnpm build` to confirm the new posts generate static pages
   (`app/blog/[slug]/page.tsx` picks them up automatically via
   `getAllSlugs()` — no code changes required for new posts).
5. Report which slugs were added, and any skipped (non-Jason-authored)
   files found in the source dir.

## Notes
- No code change is ever required to add a post — `content/blog/*.md` is
  scanned dynamically by `lib/blog/posts.ts`. This skill is purely a file
  copy + filter operation.
- If `lib/blog/posts.ts`'s expected frontmatter fields change, update this
  skill's description of the schema to match.
