---
title: "Ready the Foundation: 170GB Reclaimed and One Wrong Assumption Corrected Before the Upgrade Started"
slug: "ready-the-foundation-170gb-reclaimed-and-one-wrong-assumption-corrected-before-the-upgrade-started"
author: "Jason Chen"
publishedAt: "2026-09-03"
excerpt: "Before any of the eight required version stops, there was a day of unglamorous groundwork: confirming the backup mechanism actually produces a restorable file,..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/ready-the-foundation-170gb-reclaimed-and-one-wrong-assumption-corrected-before-the-upgrade-started-1e8cbe4f22b5"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*Wtjh3hBpiEFXntVreVfOow.png"
series: { name: "gitlab", part: 4 }
---

*Live Wire: A Solo GitLab Upgrade Log — Before any version stop, the boring work: verifying backups actually work, finding out a log file was quietly growing by 9GB a day, and correcting an assumption about what was and wasn’t being backed up.*

![](https://miro.medium.com/v2/resize:fit:1400/1*Wtjh3hBpiEFXntVreVfOow.png)

> This is Part 4 of "Live Wire: A Solo GitLab Upgrade Log" Previous: [Five Runners, Five Traps: Migrating Off a Deprecated Token, One Failure Mode at a Time](https://jason-chen-0604.medium.com/five-runners-five-traps-migrating-off-a-deprecated-token-one-failure-mode-at-a-time-05b10e070f58) ｜ Series overview: [Live Wire: A Solo GitLab Upgrade Log — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [The Image That Wouldn't Die: Tracing a Stuck Deletion to a Protocol-Level Lie](https://jason-chen-0604.medium.com/the-image-that-wouldnt-die-tracing-a-stuck-deletion-to-a-protocol-level-lie-fccb95a8cf35)

## TL;DR

Before any of the eight required version stops, there was a day of unglamorous groundwork: confirming the backup mechanism actually produces a restorable file, correcting a wrong assumption about what it does and doesn’t include by default, and dealing with a log directory quietly growing by roughly 9GB a day. Along the way, a disk-cleanup command reported reclaiming 0 bytes from 117GB of supposedly reclaimable volumes — not because it was broken, but because it choked on volume count. None of this was dramatic. All of it would have been much worse to discover mid-upgrade instead of the day before.

## Why the Boring Work Comes First

A risky upgrade doesn’t get safer because the plan is good — it gets safer because the boring prerequisites are actually true. A backup that’s never been run isn’t a backup, it’s a hope. Disk space that “should be enough” isn’t verified. This is the day that turned both of those from assumptions into confirmed facts, before any of the eight required stops started.

## The Fix, in One Sentence

Run the real backup command and inspect what it actually produces, don’t assume what’s excluded by default, and treat “the disk cleanup command finished” as different from “the disk cleanup command worked.”

## Quick Start: What the Backup Actually Needs

```
# GitLab's own backup, run inside the container — SKIP=registry is
# deliberate, not an oversight (more on why below)
docker exec -t gitlab-web-1 gitlab-rake gitlab:backup:create SKIP=registry

# Check what's actually eating disk before assuming anything
docker system df
df -h /data
```

The `SKIP=registry` flag turned out to matter more than it looks.

## Correcting an Assumption About What Gets Backed Up

An earlier assumption held that the registry’s roughly 1.2TB of image data was entirely outside the scope of `gitlab:backup` by default — in other words, that it was already safely excluded without needing to say so explicitly. That assumption was wrong. Watching an actual backup run without the `SKIP=registry` flag showed `registry.tar.gz` growing steadily and continuously — 116MB, then past 2.6GB and still climbing — proof that the registry gets pulled into the backup archive unless explicitly told not to.

That’s the opposite of what “probably excluded” implies. `**SKIP=registry**`** isn't a shortcut — it's the thing standing between a normal-length backup and one that also tries to move 1.2TB of image data every single run.** Registry protection comes from the existing whole-machine hypervisor snapshots instead, which is a separate, already-working mechanism — not a gap left open by skipping it here.

## The Backup Itself: 40GB, Just Under Two Hours, and an Unplanned Resilience Test

The real backup run took 1 hour 56 minutes — 17:37 to 19:32 — and produced a 40.46GB archive. Partway through, the internal network actually dropped for 20 to 30 minutes; ping and SSH both timed out. The backup kept running the entire time, unaffected, because it was started with `docker exec -d` — detached, running inside the container, independent of whatever was happening to the host's network connectivity at that moment. Not a test that was planned on purpose, but a useful one anyway.

## A Log File Growing by 9GB a Day

```
api_json.log      35.9 GB   (actively growing)
api_json.log.1     81.1 GB   (waiting for the next rotation to compress it)
```

Roughly 9GB of log growth per day, with the largest file sitting uncompressed until GitLab’s own rotation got around to it. Manually compressing `api_json.log.1` ahead of schedule — a plain `gzip` — took it from 81GB down to 2.7GB, a 96.7% reduction, and brought `/data/logs` down from 205GB to 132GB in one pass.

## The Cleanup Command That Reported Zero, and Wasn’t Lying

```
docker system prune -a --volumes -f
# reclaimed 41GB from images — real progress

docker system df
# Local Volumes: 117.8GB, 99% reclaimable
docker volume prune -f
# Total reclaimed space: 0B
```

That last result looks like a broken command. It isn’t — the environment had **1,580 individual volumes**, and `docker volume prune` appears to simply not handle that volume count well in a single pass. Testing in small batches confirmed the theory:

```
docker volume ls -q | head -50 | xargs docker volume rm
# all 50 succeeded, 0 rejected as in-use
```

Working through the full set in batches of 50 is what actually reclaimed the space that a single `prune` call reported as untouchable.

## Under the Hood

```
+-------------------------+------------------------------------------------+---------------------------------------------------+
| Item                    | What I Did                                        | Why It Mattered                                     |
+-------------------------+------------------------------------------------+---------------------------------------------------+
| Backup scope assumption | Watched a real backup run without SKIP=registry   | Confirmed the registry IS included by default —     |
|                         | to test what "probably excluded" actually meant   | nothing protects against a 1.2TB surprise silently   |
+-------------------------+------------------------------------------------+---------------------------------------------------+
| Backup verification      | Ran the real command, timed it, confirmed the      | A backup that's never actually been run isn't a     |
|                         | output file exists and is a sane size              | backup — it's an assumption                          |
+-------------------------+------------------------------------------------+---------------------------------------------------+
| Log growth               | Manually compressed the largest uncompressed log   | 81GB to 2.7GB ahead of GitLab's own rotation         |
|                         | file before rotation would have caught it           | schedule, freeing 73GB immediately                    |
+-------------------------+------------------------------------------------+---------------------------------------------------+
| Disk cleanup blind spot | Diagnosed why prune reported 0B reclaimed on        | 1,580 volumes was too many for a single prune call — |
|                         | 117GB of "reclaimable" volumes, then batched it     | batching in groups of 50 actually worked             |
+-------------------------+------------------------------------------------+---------------------------------------------------+
```

## What Actually Worked

Testing the backup command for real, rather than trusting what its scope “should” be, is what caught the registry assumption before it became a 1.2TB surprise mid-upgrade. The same principle applied to disk cleanup: a command reporting 0B reclaimed could have been read as “there’s nothing left to clean,” when the real story was a tool hitting a scale limit it doesn’t advertise.

## Where This Still Falls Short

Nothing here was dramatic, and that’s worth saying plainly rather than dressing it up. There’s no clever root cause, no near-miss averted at the last second — just verification work that turned assumptions into confirmed facts before anything riskier started. That’s a less exciting kind of engineering than most of the rest of this series, and it’s also the kind that makes the exciting parts survivable.

Have you ever found a tool silently hitting a scale limit — reporting success, or reporting nothing, instead of telling you it simply couldn’t handle the size of what you gave it?

Live Wire: A Solo GitLab Upgrade Log ｜ Previous: [Five Runners, Five Traps](https://jason-chen-0604.medium.com/five-runners-five-traps-migrating-off-a-deprecated-token-one-failure-mode-at-a-time-05b10e070f58) ｜ Series overview: [Live Wire — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [The Image That Wouldn’t Die](https://jason-chen-0604.medium.com/the-image-that-wouldnt-die-tracing-a-stuck-deletion-to-a-protocol-level-lie-fccb95a8cf35)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
