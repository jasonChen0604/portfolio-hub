---
title: "Welcome to Our Blog"
slug: "welcome-to-our-blog"
author: "Jason Chen"
publishedAt: "2026-07-11"
excerpt: "We're launching a blog to share updates, behind-the-scenes notes, and technical write-ups about building this tool website."
tags: ["Announcement", "Tool Website", "Software Engineering"]
---

We're excited to launch this blog. It's a place to share what we're building,
why we're building it, and the occasional deep-dive into how a feature came
together.

## Why a blog

The tool website has grown into 40+ utilities across calculators, converters,
generators, and more. Along the way we've made plenty of small engineering
decisions worth writing down — this is where those notes will live.

Here's a tiny example of the kind of code snippet you'll see in posts:

```ts
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
```

More posts coming soon. Thanks for reading.
