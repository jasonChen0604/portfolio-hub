---
title: "Station 1–2: The Estimation Trap"
slug: "station-1-2-the-estimation-trap"
author: "Jason Chen"
publishedAt: "2026-09-04"
excerpt: "Station 1 finished its background migrations in minutes, which made Station 2 — carrying the same “ordinary risk” label — feel like it should behave the same..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/station-1-2-the-estimation-trap-9c040df45db6"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*5uOVPUSVSg0wj5TN98dfGA.png"
series: { name: "gitlab", part: 6 }
---

*Live Wire: A Solo GitLab Upgrade Log — Two upgrade stations, both labeled “ordinary risk.” One finished in six minutes. The other one, by the first estimate, was going to take twenty hours.*

![](https://miro.medium.com/v2/resize:fit:1400/1*5uOVPUSVSg0wj5TN98dfGA.png)

> This is Part 6 of "Live Wire: A Solo GitLab Upgrade Log" Previous: [The Image That Wouldn't Die: Tracing a Stuck Deletion to a Protocol-Level Lie](https://jason-chen-0604.medium.com/the-image-that-wouldnt-die-tracing-a-stuck-deletion-to-a-protocol-level-lie-fccb95a8cf35) ｜ Series overview: [Live Wire: A Solo GitLab Upgrade Log — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Station 3: GitLab Behaved, I Didn't](https://jason-chen-0604.medium.com/station-3-gitlab-behaved-i-didnt-276a0b610c32)

## TL;DR

Station 1 finished its background migrations in minutes, which made Station 2 — carrying the same “ordinary risk” label — feel like it should behave the same way. It didn’t: 28 migrations instead of 6, and two tables with over 300,000 rows apiece instead of a largest table barely over a thousand. The first progress estimate, based on completed batch count, said 8% done and roughly 20 hours remaining. The real number, based on rows actually processed, was 41% done with about 1.7 hours left. Same data, two completely different answers, because one method was measuring the wrong thing.

## Two Stations, One Misleading Assumption

Station 1–17.4.2 to 17.5.5 — went by fast. Its background migrations finished within minutes of the version bump, no drama, nothing to track. Station 2 carried the same “ordinary risk” label in the plan, which made it easy to assume it would behave the same way. It didn’t, and the gap wasn’t visible until the numbers were actually pulled.

## The Fix, in One Sentence

Don’t estimate migration progress by counting completed batches — count actual rows processed against elapsed time, because batch size isn’t fixed.

## Quick Start: Measuring Progress the Right Way

```
-- What it's tempting to check first (misleading on its own)
SELECT job_class_name, table_name, total_tuple_count, batch_size,
       CEIL(total_tuple_count::numeric / NULLIF(batch_size, 0)) AS est_batches
FROM batched_background_migrations
WHERE status = 1
ORDER BY total_tuple_count DESC NULLS LAST;

-- What actually reflects real progress: rows processed vs. elapsed time
SELECT bbm.job_class_name, bbm.total_tuple_count,
       SUM(bj.max_value - bj.min_value + 1) AS rows_processed,
       MIN(bj.started_at) AS first_started, MAX(bj.finished_at) AS last_finished
FROM batched_background_migrations bbm
JOIN batched_background_migration_jobs bj
  ON bj.batched_background_migration_id = bbm.id
WHERE bbm.status = 1 AND bj.status = 3
GROUP BY bbm.job_class_name, bbm.total_tuple_count;
```

The first query is the one that’s easy to reach for. The second one is the one that actually matters.

## The Scale Nobody Adjusted For

Station 1 had 6 migrations, largest table 1,323 rows. Station 2 had 28 migrations, with two separate tables over 319,000 rows each. Both stations carried the same plan-level risk label, but nothing about that label reflected this difference in scale.

GitLab’s batched background migrations run on a fixed cron schedule — once a minute — with a configured cap of 2 migrations running concurrently at once. Two tables at roughly 319,000 rows each, at an initial batch size of 1,200, work out to roughly 320 batches apiece before either one finishes.

## The First Estimate: 8%, and Roughly Twenty Hours Left

Migrations started at 04:51 UTC. Checking in at 06:52 UTC — about two hours in — showed `RemoveOldJobTokens`, the 319,061-row table, at 20 completed batches out of roughly 320 expected. That's 8% by batch count, and extrapolating that rate out to completion pointed at something in the neighborhood of 20 more hours.

## The Reveal: Batch Size Isn’t Fixed

The batch count wasn’t wrong — it was measuring something that doesn’t map linearly to progress. `**batch_size**`** grows dynamically as the migration runs.** It started at 1,200. By 07:25 UTC, it had grown to 22,161 — nearly 20 times larger than where it began. A migration counting 20 "small" batches and a migration counting 20 "large" batches look identical from the batch-count column, but represent wildly different amounts of actual work completed.

## The Real Number: 41%, and About 1.7 Hours Left

Re-running the row-based query at the 72-minute mark (07:25 UTC) told a completely different story: **131,286 of 319,061 rows processed — 41% done**, at an actual measured rate of about 1,813 rows per minute. At that rate, the remaining rows worked out to roughly 1.7 hours, not 20. Same migration, same moment in time, two estimation methods five times more optimistic apart than the label “ordinary risk” would ever suggest.

## Under the Hood

```
+---------------------+----------------------------------------+-----------------------------------------------+
| Item                 | What I Did                                | Why It Mattered                                  |
+---------------------+----------------------------------------+-----------------------------------------------+
| Scale check           | Compared migration count and table size   | Same risk label hid a 240x difference in         |
|                       | between Station 1 and Station 2            | largest-table row count                           |
+---------------------+----------------------------------------+-----------------------------------------------+
| First estimate         | Counted completed batches against          | Produced an 8% estimate and a ~20 hour            |
|                       | expected batch count                       | projection — both wrong                            |
+---------------------+----------------------------------------+-----------------------------------------------+
| Root cause             | Found batch_size grows dynamically         | 1,200 to 22,161 across 72 minutes — batch count   |
|                       | during a running migration                  | alone can't reflect that                           |
+---------------------+----------------------------------------+-----------------------------------------------+
| Correct estimate       | Measured actual rows processed against     | 41% done, ~1.7 hours remaining — five times        |
|                       | elapsed time instead                        | more accurate than the batch-count method          |
+---------------------+----------------------------------------+-----------------------------------------------+
```

## What Actually Worked

Switching from “how many batches finished” to “how many rows actually got processed, measured against real elapsed time” was the entire fix — and it’s a substitution that applies to any batched or chunked process, not just this one. Re-measuring the rate directly, instead of assuming a fixed rate from the start of the migration, is what made the corrected estimate trustworthy rather than just a different guess.

## Where This Still Falls Short

The plan’s risk labels — “ordinary,” “elevated,” and so on — turned out to say nothing reliable about actual migration scale or duration. That’s a gap in the planning process itself, not something this estimation fix resolves; a future station could carry the same label and still hide a similarly large surprise. The honest version of this story includes the wrong number first: the 8% estimate was the real first read, not a hypothetical bad example invented after the fact.

Have you ever trusted a progress metric that measured something real, just not the thing that actually mattered?

Live Wire: A Solo GitLab Upgrade Log ｜ Previous: [The Image That Wouldn’t Die](https://jason-chen-0604.medium.com/the-image-that-wouldnt-die-tracing-a-stuck-deletion-to-a-protocol-level-lie-fccb95a8cf35) ｜ Series overview: [Live Wire — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Station 3: GitLab Behaved, I Didn’t](https://jason-chen-0604.medium.com/station-3-gitlab-behaved-i-didnt-276a0b610c32)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
