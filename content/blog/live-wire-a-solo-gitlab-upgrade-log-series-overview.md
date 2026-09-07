---
title: "Live Wire: A Solo GitLab Upgrade Log — Series Overview"
slug: "live-wire-a-solo-gitlab-upgrade-log-series-overview"
author: "Jason Chen"
publishedAt: "2026-09-01"
excerpt: "Eight required stops, one CVSS 9.4 vulnerability, and no test environment to rehearse any of it in. This GitLab instance has been carrying production traffic..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*YD8KuDtUiYvPX0MtdvUhzg.png"
---

*Eight required stops, one CVSS 9.4 vulnerability, and no test environment to rehearse any of it in.*

![](https://miro.medium.com/v2/resize:fit:1400/1*YD8KuDtUiYvPX0MtdvUhzg.png)

This GitLab instance has been carrying production traffic for three years — self-hosted, docker-compose deployment, Postgres and a container registry underneath it, real merge requests and real CI pipelines from people who don’t stop for maintenance windows. There’s no staging replica of it anywhere. There never has been.

This series is the record of moving that instance from GitLab 17.4.2 to 19.2.4 — eight mandatory version stops, one CVSS 9.4 vulnerability that forced the timeline, and no test environment to rehearse any of it in advance. Every entry follows roughly the same shape: what the actual risk was, what got checked before anything ran, and what happened when the plan met the real system.

Below is every entry, in the order things actually happened. The series is still in progress — new stations get added here as they complete.

## Part 1 — [The Plan: Upgrading a Live GitLab From 17.4.2 to 19.2.4 With Zero Test Environments](https://jason-chen-0604.medium.com/the-plan-upgrading-a-live-gitlab-from-17-4-2-to-19-2-4-with-zero-test-environments-92bbdbcb0119)

A GraphQL vulnerability with a CVSS score of 9.4 doesn’t wait for a convenient window. Mapping eight required stops with no test environment, and the one silent bug in the plan that could have quietly destroyed data instead of just breaking a build.

## Part 2 — [The Runner Audit: 43 Runners, One Column Everyone Trusts, One Wrong Answer](https://jason-chen-0604.medium.com/the-runner-audit-43-runners-one-column-everyone-trusts-one-wrong-answer-7155e795ce1c)

Forty-three CI runners, and a completely reasonable way to tell which ones were still in use — that turned out to be measuring the wrong thing entirely.

## Part 3 — [Five Runners, Five Traps: Migrating Off a Deprecated Token, One Failure Mode at a Time](https://jason-chen-0604.medium.com/five-runners-five-traps-migrating-off-a-deprecated-token-one-failure-mode-at-a-time-05b10e070f58)

Migrating five runners off a deprecated authentication token. Every single one of them failed for a different reason.

## Part 4 — [Ready the Foundation: 170GB Reclaimed and One Wrong Assumption Corrected Before the Upgrade Started](https://jason-chen-0604.medium.com/ready-the-foundation-170gb-reclaimed-and-one-wrong-assumption-corrected-before-the-upgrade-started-1e8cbe4f22b5)

The unglamorous work before any real risk starts: backup verification, disk cleanup, and a log file that was quietly growing by 9GB a day.

## Part 5 — [The Image That Wouldn’t Die: Tracing a Stuck Deletion to a Protocol-Level Lie](https://jason-chen-0604.medium.com/the-image-that-wouldnt-die-tracing-a-stuck-deletion-to-a-protocol-level-lie-fccb95a8cf35)

GitLab said the image was deleted. Three days later, it still wasn’t. The actual cause lived one layer below the application, in a handshake nobody thinks to check.

## Part 6 — [Station 1–2: The Estimation Trap](https://jason-chen-0604.medium.com/station-1-2-the-estimation-trap-9c040df45db6)

Two upgrade stations, both labeled “ordinary risk.” One finished in six minutes. The other one, by the first estimate, was going to take twenty hours.

## Part 7 — [Station 3: GitLab Behaved, I Didn’t](https://jason-chen-0604.medium.com/station-3-gitlab-behaved-i-didnt-276a0b610c32)

Zero surprises from GitLab itself. Four separate ones from sudo, shell escaping, and a grep filter that quietly ate its own output.

## Part 8 — [Station 4: The Day Before the Six Minutes](https://jason-chen-0604.medium.com/station-4-the-day-before-the-six-minutes-a8eb0c03760c)

The single riskiest step in the whole plan: swapping the database engine underneath a live instance. One full day of rehearsal turned a 30-minute official estimate into six minutes of real downtime.

## Station 5–6: The Migration That Fixed Itself — coming soon

A migration flagged to fail before it even ran. The official advice: don’t fix it, just keep upgrading — and find out two stations later whether that was actually true.

## Station 6: The Bug GitLab Hasn’t Fixed Yet — coming soon

An intermittent 500 pointing at a column that vanished. Except it hadn’t vanished — it had just been renamed three versions earlier.

## Tuning the Parallelism Knob (Stations 5–8) — coming soon

A database setting that isn’t even in the official API sped up mid-size migrations noticeably. A 320,000-row table didn’t care.

## Station 7–8: The Backup That Looked Broken — coming soon

A backup file a third the size it should have been. The process behind it never actually stopped.

## Stations 9–11 — coming soon

The database engine’s second act, and the fix Registry has been waiting for since early in this series.

## Discipline, Not Luck — coming soon

What eleven stations end to end actually taught, once the adrenaline wore off.

More entries will be added to this list as they’re published — check back, or follow along for updates.

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
