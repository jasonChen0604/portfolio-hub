---
title: "The Runner Audit: 43 Runners, One Column Everyone Trusts, One Wrong Answer"
slug: "the-runner-audit-43-runners-one-column-everyone-trusts-one-wrong-answer"
author: "Jason Chen"
publishedAt: "2026-09-01"
excerpt: "Before the upgrade path even started, the plan called for trimming the runner fleet — fewer moving parts to carry across eight version stops. The obvious..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/the-runner-audit-43-runners-one-column-everyone-trusts-one-wrong-answer-7155e795ce1c"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*Evw0TTQRLe3bG8G3ALvxZw.png"
series: { name: "gitlab", part: 2 }
---

*Live Wire: A Solo GitLab Upgrade Log — Before touching a single version stop, the plan called for trimming dead weight. The obvious way to measure “dead” turned out to measure the wrong thing entirely.*

![](https://miro.medium.com/v2/resize:fit:1400/1*Evw0TTQRLe3bG8G3ALvxZw.png)

> This is Part 2 of "Live Wire: A Solo GitLab Upgrade Log" Previous: [The Plan: Upgrading a Live GitLab From 17.4.2 to 19.2.4 With Zero Test Environments](https://jason-chen-0604.medium.com/the-plan-upgrading-a-live-gitlab-from-17-4-2-to-19-2-4-with-zero-test-environments-92bbdbcb0119) ｜ Series overview: [Live Wire: A Solo GitLab Upgrade Log — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Five Runners, Five Traps: Migrating Off a Deprecated Token, One Failure Mode at a Time](https://jason-chen-0604.medium.com/five-runners-five-traps-migrating-off-a-deprecated-token-one-failure-mode-at-a-time-05b10e070f58)

## TL;DR

Before the upgrade path even started, the plan called for trimming the runner fleet — fewer moving parts to carry across eight version stops. The obvious column to check was `contacted_at`, the last time each runner's process talked to the server. It's a reasonable-sounding proxy for "is this thing still in use." It's also wrong: a runner can poll the server every minute for years without ever running a single job. Cross-referencing against real job history instead of the contact timestamp cut the fleet from 43 down to 23, and turned up a second, unrelated security issue along the way.

## The Column That Sounds Right

`contacted_at` is the kind of field name that does half the convincing on its own. It reads like "last active," so the obvious move — before checking anything else — is to sort by it and assume the oldest timestamps belong to the runners nobody uses anymore. That assumption drove the first pass through all 43 registered runners.

It’s wrong in a specific, easy-to-miss way: `**contacted_at**`** only proves the **`**gitlab-runner**`** process is still alive and polling the server.** It updates every time the process checks in for work, whether or not any work exists. A runner that's been sitting completely idle for a year, never once picking up a job, updates this field just as reliably as one running jobs every hour — as long as the process itself hasn't crashed or been stopped.

## The Fix, in One Sentence

Stop trusting the heartbeat, and cross-reference each runner against its actual job history in `ci_builds` — the table that records what a runner has actually done, not just whether it's still breathing.

## Quick Start: Querying What Actually Matters

```
-- What contacted_at alone tells you (misleading on its own)
SELECT id, description, contacted_at
FROM ci_runners
ORDER BY contacted_at ASC;

-- What actually matters: real job history per runner
SELECT
  r.id,
  r.description,
  r.contacted_at,
  (SELECT MAX(b.created_at) FROM ci_builds b WHERE b.runner_id = r.id) AS last_job_at,
  (SELECT COUNT(*) FROM ci_builds b
     WHERE b.runner_id = r.id AND b.created_at > NOW() - INTERVAL '30 days') AS jobs_30d
FROM ci_runners r
WHERE r.registration_type = 0
ORDER BY jobs_30d DESC, last_job_at DESC NULLS LAST;
```

Running the second query against all 43 registered runners split them into two groups that `contacted_at` alone couldn't distinguish: 16 with genuine recent job activity, and 18 that had been polling faithfully for months or years without ever picking up real work.

## Round Two: A Stricter Line, Not a Bigger Sweep

The first pass didn’t try to be exhaustive — it went after the clearest cases, runners that had been idle for months to years with zero ambiguity. That took the fleet down by 18. A second pass followed later, with a tighter threshold: anything with no job in the last six months. That caught three more — three runners whose last recorded job was the same date, months earlier, along with three others that had never run a single job since the day they were registered.

Splitting the cleanup into two deliberate passes, rather than one aggressive sweep with a single cutoff, meant the riskiest judgment calls (the six-month-and-up cases) got made separately from the obvious ones, with time to reconsider in between.

## The Trap Inside the Trap: Don’t Blame the Runner Too Fast

One more wrinkle showed up mid-audit: a runner appeared completely unable to pick up jobs from a specific — and brand new — project, which looked at first like more evidence the runner was broken or dead. It wasn’t. **Project-type runners don’t automatically work for new projects.** Each one needs to be explicitly authorized per project, and a fresh project simply hasn’t had that authorization set up yet. That’s a completely different problem from “this runner is idle and unused,” and treating the two as the same thing would have meant deleting a perfectly healthy runner for the wrong reason.

## Under the Hood

```
+----------------------+-------------------------------------------+------------------------------------------------+
| Item                 | What I Did                                 | Why It Mattered                                  |
+----------------------+-------------------------------------------+------------------------------------------------+
| Initial filter        | Cross-referenced ci_builds job counts,     | contacted_at only proves the process is polling, |
|                       | not just contacted_at                       | not that any job has ever run                    |
+----------------------+-------------------------------------------+------------------------------------------------+
| Cleanup rounds        | Split into two passes: obvious cases       | Kept the riskiest judgment calls separate from   |
|                       | first, stricter 6-month threshold second   | the unambiguous ones                              |
+----------------------+-------------------------------------------+------------------------------------------------+
| False-positive check  | Confirmed a "stuck" runner was actually    | Project-type runners need per-project            |
|                       | an unauthorized-for-this-project issue     | authorization — not evidence of being dead        |
+----------------------+-------------------------------------------+------------------------------------------------+
| Result                | 43 runners reduced to 23                    | Fewer moving parts to carry through 8 version    |
|                       |                                             | stops later in the plan                          |
+----------------------+-------------------------------------------+------------------------------------------------+
```

## What Actually Worked

Querying real job history instead of trusting a field name that sounds like it means “active” was the whole fix — everything else followed from that one substitution. The two-round approach mattered almost as much: separating “obviously idle for years” from “no jobs in six months” meant the harder judgment calls didn’t get rushed through alongside the easy ones.

## Where This Still Falls Short

This audit happened during pre-upgrade prep, not the upgrade execution itself — trimming the fleet was groundwork, not one of the eight required stops. It’s also worth saying plainly: this pass focused on whether a runner was *used*, not on whether the ones that remain are configured well. Auditing configuration quality — resource limits, tagging discipline, whether the survivors are even sized correctly for what they run — is a separate question this pass didn’t try to answer.

One thing worth mentioning without dwelling on it: the audit also surfaced an account, already disabled, that still held an active token with an expiration date decades out — effectively permanent. It got revoked immediately. Not the finding this audit was looking for, but a reminder that “cleaning up what’s unused” and “checking what still has access” are worth doing at the same time.

Have you ever trusted a field name over what it actually measures — and found out later they weren’t the same thing?

Live Wire: A Solo GitLab Upgrade Log ｜ Previous: [The Plan](https://jason-chen-0604.medium.com/the-plan-upgrading-a-live-gitlab-from-17-4-2-to-19-2-4-with-zero-test-environments-92bbdbcb0119) ｜ Series overview: [Live Wire — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Five Runners, Five Traps](https://jason-chen-0604.medium.com/five-runners-five-traps-migrating-off-a-deprecated-token-one-failure-mode-at-a-time-05b10e070f58)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
