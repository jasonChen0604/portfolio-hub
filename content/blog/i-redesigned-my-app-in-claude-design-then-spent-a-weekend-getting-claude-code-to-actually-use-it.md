---
title: "I Redesigned My App in Claude Design, Then Spent a Weekend Getting Claude Code to Actually Use It"
slug: "i-redesigned-my-app-in-claude-design-then-spent-a-weekend-getting-claude-code-to-actually-use-it"
author: "Jason Chen"
publishedAt: "2026-07-21"
excerpt: "Five attempts, one that finally worked, and a 95% match to the design — using nothing but Sonnet 5."
tags: ["Claude Design", "Claude Code", "Claude Ai", "Prompt Engineering", "Web Design"]
sourceUrl: "https://medium.com/@jason-chen-0604/i-redesigned-my-app-in-claude-design-then-spent-a-weekend-getting-claude-code-to-actually-use-it-4589298724b4"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/format:webp/1*5uV0WTwwPbynkBvTnHqQ5Q.jpeg"
---

*Five attempts, one that finally worked, and a 95% match to the design — using nothing but Sonnet 5.*

![the old cards-style homepage vs. the new left-aligned/terminal-tag rebuild, side by side](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*5uV0WTwwPbynkBvTnHqQ5Q.jpeg)

*the old cards-style homepage vs. the new left-aligned/terminal-tag rebuild, side by side*

Redesigning a live product is a bit like renovating a house while you're still living in it. You can repaint the walls in an afternoon, but the moment you try to move a load-bearing one — the actual codebase — everything you touch turns out to be connected to three other things you forgot existed. I found this out the fun way after I redesigned my app's frontend in **Claude Design** and then tried to get that redesign back into the **Claude Code** repo where the app actually lives.

The pitch for the workflow is simple: design visually on the canvas, hand the result to Claude Code, let it rebuild the UI against your real components instead of a screenshot. In practice, getting from "looks great in Claude Design" to "builds correctly in my repo" took five separate attempts. Only the last one actually worked.

> **TL;DR** — 5 handoff methods tried, 2 that actually did something, 1 that worked. Final result: **~95%** of the design matched, fixed in **1–2 follow-up prompts**. Model used for the entire process: **Claude Sonnet 5** — no premium tier needed. The catch: works **one page at a time**, more on that at the end.

## The one-line version

Claude Design and Claude Code are supposed to sync in both directions — you can hand a finished design off to be built, or pull your existing design system into a new Claude Design project. The handoff step is where things got messy for me.

## Quick Start

Skip straight to what actually worked — publish a live demo, then force Claude Code to rebuild against it instead of nudging it with a static file:

```bash
# 1. In Claude Design, open your project
#    Share → Publish as artifact  →  copy the public demo URL

# 2. In Claude Code, make sure the Playwright MCP is connected
#    (it needs to actually load and inspect the live demo page,
#    not just read a file)
claude mcp add --scope user playwright

# 3. Point Claude Code at both the demo URL and the earlier
#    standalone HTML export, and be explicit that nothing
#    old survives:
"Reference this live demo at <demo-url> together with
design-reference.html. Do not preserve any part of the
current design - rebuild the UI to fully match the demo,
section by section."
```

That last line still matters. Keep reading for why — and for the four attempts before this one that *didn't* work, in case you're about to make the same mistakes I did.

## The five attempts

**Attempt one: the "Send to Claude Code" button.** From the Claude Design canvas, I used **Share → More formats and apps → Claude Code (Send)**. This is supposed to package the design as a handoff bundle — component structure, tokens, the whole thing — and drop it straight into a Claude Code session. Instead, Claude Code kept trying to reach for external design tools, specifically the **Figma MCP**, as if the handoff bundle wasn't enough on its own. I hadn't set up an MCP server for Claude Design itself, and nothing in the flow told me I needed to. So Claude Code fell back on the integration pattern it already knew — treat this like any other design import, go looking for Figma — instead of just working from what I'd sent it.

**Attempt two: `/design-sync`, no arguments.** I closed that session and tried the dedicated sync command instead. First problem: run bare, `/design-sync` doesn't tell you whether it's about to **push** your current code into a design draft or **pull** an existing design into your code. I genuinely couldn't tell which direction it was about to go, and I did not want to find out by watching it overwrite something. I killed the command before it finished and went looking for a way to be explicit about direction.

**Attempt three: `/design-sync` with the share URL appended.** This is the one that actually did something useful. Pasting the Claude Design share link directly after the command — `/design-sync <url>` — made the intent unambiguous: pull this specific design in. It ran, it touched files, and for a minute I thought I was done.

I wasn't. Here's the honest tally on the result:

- Roughly **70%** of the new design actually landed — spacing, some component swaps, a chunk of the color and type updates.
- The remaining **30%** was a patchwork: some sections were still rendering the old UI as if the sync had skipped them entirely.
- The **responsive breakpoints** were the worst part. Layouts that looked right on desktop broke slightly at tablet width — nothing catastrophic, just enough visual drift that it wouldn't pass a real design review.

None of this showed up as an error. The command exited clean. The only way I caught it was by clicking through the app manually at different viewport widths and comparing it side by side with the Claude Design canvas — which is a slow, manual process that defeats a lot of the point of "automated handoff."

**Attempt four: dropping the standalone HTML export straight into the repo.** After the `/design-sync` result came back at ~70%, I tried skipping the sync command entirely and going lower-level. From Claude Design: **Share → Project HTML → Standalone HTML**. That downloads a single self-contained `.html` file — fonts, images, and brand assets all inlined, no external dependencies. I dropped that file at the root of my project, right next to `package.json`, so Claude Code couldn't miss it:

```
my-app/
├── package.json
├── design-reference.html      <- the Claude Design export, dropped at root
├── src/
│   ├── components/
│   ├── pages/
│   └── styles/
└── public/
```

Then I pointed Claude Code straight at it — "here's `design-reference.html`, use it as the reference and update the site to match." My theory was that removing the sync-command indirection and just handing Claude Code a literal file to diff against would close that missing 30%.

It didn't. The result landed in roughly the same place as the `/design-sync` attempt — same ballpark of coverage, same kind of gaps. Claude Code kept **deferring to the site's existing design** in places instead of fully committing to what was in the reference file. Sections that should have been a straight visual swap stayed partially anchored to the old layout, as if the model was treating the HTML file as "inspiration" rather than "source of truth." Whatever the actual sync mechanism does internally, going around it with a raw file didn't change the outcome — which tells me the bottleneck isn't the `/design-sync` command itself, it's something in how Claude Code reconciles a new design against code it's already confident about.

**Attempt five: a live demo URL, Playwright MCP, and an explicit "keep nothing" instruction.** This is the one that finally moved the needle. Instead of exporting a file, I went to **Claude Design → Share → Publish as artifact**, which spins up a public web demo URL — an actual live, interactive page instead of a static export. Then in Claude Code, I brought in the **Playwright MCP** and told it to reference that live demo URL alongside the standalone HTML file from attempt four.

The part that mattered most wasn't the tooling, though — it was the prompt. I explicitly told Claude Code to **not preserve any of the original design**, and to rebuild against the demo from scratch instead of patching the existing UI. That instruction is what attempts three and four were missing: without it, Claude Code defaults to treating your current code as the source of truth and the new design as a suggestion. Telling it outright to throw the old design away, and giving it a live page it could actually load and inspect via Playwright rather than a flat file, changed the outcome.

The result: **~95%** matched the design faithfully. A few small pieces of the old design still lingered, and there was still minor breakpoint drift here and there — but nowhere near the scale of the earlier attempts. Better yet, the remaining gaps turned out to be fixable. Going back into Claude Code and calling out **specific sections by name** — "the pricing cards still use the old spacing," "the mobile nav is reverting to the previous layout" — got those last pieces in line without another full rebuild.

## What I did, step by step

| Step | What I did | Result |
| --- | --- | --- |
| Send from Claude Design | Share → More formats and apps → Claude Code | Claude Code tried to reach for Figma MCP instead of using the bundle directly |
| `/design-sync` bare | Ran the command with no arguments | No clear signal on push vs. pull direction — aborted before it committed to anything |
| `/design-sync <share-url>` | Appended the Claude Design share link directly to the command | Ran successfully, but only ~70% of the design actually applied |
| Standalone HTML at repo root | Share → Project HTML → Standalone HTML, dropped the file at project root, told Claude Code to reference it | Same ballpark as `/design-sync` — Claude Code still deferred to the old design in places |
| Live demo + Playwright MCP | Share → Publish as artifact for a public demo URL, connected Playwright MCP, told Claude Code to reference the demo + HTML file and preserve nothing | ~95% matched the design — best result by far |
| Targeted spot-fixes | Called out specific remaining sections by name in Claude Code (old spacing, reverted mobile nav, etc.) | Closed most of the last 5% without a full rebuild |
| Manual QA pass | Clicked through the live app at multiple breakpoints, compared against the Claude Design canvas | Confirmed the fix and caught the last bits of RWD drift |

If you're picturing an ASCII table in your head from the Medium formatting guide I usually use — here it is, for anyone pasting straight from a terminal-style view:

```
+------------------------+----------------------------------------------+----------------------------------------------------+
| Step                   | What I Did                                    | Result                                              |
+------------------------+----------------------------------------------+----------------------------------------------------+
| Send from Claude       | Share -> More formats and apps ->             | Claude Code reached for Figma MCP instead of        |
| Design                 | Claude Code                                   | using the handoff bundle directly                   |
+------------------------+----------------------------------------------+----------------------------------------------------+
| /design-sync (bare)    | Ran the command with no arguments             | No clear push/pull signal; aborted before it        |
|                        |                                                | committed to anything                                |
+------------------------+----------------------------------------------+----------------------------------------------------+
| /design-sync <url>     | Appended the Claude Design share link         | Ran successfully, but only ~70% of the design        |
|                        | directly to the command                       | actually applied                                     |
+------------------------+----------------------------------------------+----------------------------------------------------+
| Standalone HTML        | Share -> Project HTML -> Standalone HTML,     | Same ballpark as /design-sync -- Claude Code          |
| at repo root           | dropped file at project root, told Claude     | still deferred to the old design in places            |
|                        | Code to reference it directly                 |                                                       |
+------------------------+----------------------------------------------+----------------------------------------------------+
| Live demo +            | Share -> Publish as artifact for a public     | ~95% matched the design -- best result by far        |
| Playwright MCP         | demo URL, connected Playwright MCP, told      |                                                       |
|                        | Claude Code to preserve nothing               |                                                       |
+------------------------+----------------------------------------------+----------------------------------------------------+
| Targeted spot-fixes    | Called out specific remaining sections by     | Closed most of the last 5% without a full rebuild     |
|                        | name in Claude Code                           |                                                       |
+------------------------+----------------------------------------------+----------------------------------------------------+
| Manual QA pass         | Clicked through the live app at multiple      | Confirmed the fix and caught the last bits of         |
|                        | breakpoints vs. the Claude Design canvas      | RWD drift                                             |
+------------------------+----------------------------------------------+----------------------------------------------------+
```

## 🔧 Want the exact prompts and project structure?

I put the full setup — the Playwright MCP config, the exact "preserve nothing" prompt, and the before/after code — up on my GitHub. If you're trying this on your own project, start there instead of reverse-engineering it from this post.

**→ [See the full project on GitHub](https://github.com/jasonChen0604/portfolio-hub)**

## What actually worked

Four attempts, and the two that failed had something in common: they both handed Claude Code a static reference — a file, a screenshot-equivalent — and left the "how much do I keep vs. throw away" decision implicit. The fifth attempt fixed both problems at once. A **live demo URL** gave Claude Code something it could actually inspect through Playwright instead of just read, and an explicit **"preserve nothing"** instruction removed the ambiguity that let it quietly default back to the existing code.

Neither piece alone was the fix — I'd guess a live demo without the explicit instruction still would have hedged, and the instruction alone without something interactive to inspect might not have had enough to work from. Together they got me to 95%, and the last 5% turned out to be the easy part: **one or two follow-up prompts** naming the specific sections still out of alignment, rather than another full rebuild.

Worth calling out: this whole run — all five attempts, the rebuild, and the cleanup — used **Claude Sonnet 5** the entire time. No premium-tier model needed to get from a design mockup to a 95%-accurate implementation. That's the part that actually surprised me more than the workflow itself.

If you're attempting this yourself, the takeaway I'd lead with is: don't hand Claude Code a design and hope it infers how aggressively to apply it. Say it outright.

## Where this still falls short

A couple of limits worth knowing before you try this on your own project:

- **One page at a time.** This workflow, as I've run it, only reliably handles a single page per pass. If your site has multiple pages, you need to repeat the whole cycle — publish, reference, rebuild, spot-fix — separately for each one. I haven't found a way to batch it across a full multi-page site yet.
- **Nothing here is validated beyond this project.** Five attempts on one redesign is a sample size of one. I'd treat "95%" as what worked for this particular UI, not a number you should expect automatically.

I'll follow up once Claude ships something that changes the multi-page story — for now, this is where the experiment stands.

## 📬 Following along?

I'll post the multi-page version of this as soon as I've actually got it working — if you don't want to miss it, that's what LinkedIn is for. I'm also fairly active answering questions about this workflow there, faster than Medium comments usually get to me.

**→ [Connect with me on LinkedIn](https://www.linkedin.com/in/jason-cj-chen/)** for the part-two follow-up, plus the occasional shorter build-log post that doesn't make it into a full article. **→ [Browse more projects on GitHub](https://github.com/jasonChen0604)** if you want to see how this fits into the rest of what I'm building.
