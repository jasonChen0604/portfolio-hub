---
title: "The Plan: Upgrading a Live GitLab From 17.4.2 to 19.2.4 With Zero Test Environments"
slug: "the-plan-upgrading-a-live-gitlab-from-17-4-2-to-19-2-4-with-zero-test-environments"
author: "Jason Chen"
publishedAt: "2026-08-27"
excerpt: "A GraphQL code-injection vulnerability, CVSS 9.4, forced a production GitLab instance three years and eight major versions behind current to finally upgrade —..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/the-plan-upgrading-a-live-gitlab-from-17-4-2-to-19-2-4-with-zero-test-environments-92bbdbcb0119"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*Z7Bt5Skx3pooaVnAx92zYw.png"
series: { name: "gitlab", part: 1 }
---

*Live Wire: A Solo GitLab Upgrade Log #1 — Eight mandatory stops, one CVSS 9.4 vulnerability, and no dress rehearsal allowed.*

![](https://miro.medium.com/v2/resize:fit:1400/1*Z7Bt5Skx3pooaVnAx92zYw.png)

> This is Part 1 of "Live Wire: A Solo GitLab Upgrade Log" Series overview: [Live Wire: A Solo GitLab Upgrade Log — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [The Runner Audit: 43 Runners, One Column Everyone Trusts, One Wrong Answer](https://jason-chen-0604.medium.com/the-runner-audit-43-runners-one-column-everyone-trusts-one-wrong-answer-7155e795ce1c)

## TL;DR

A GraphQL code-injection vulnerability, CVSS 9.4, forced a production GitLab instance three years and eight major versions behind current to finally upgrade — with no staging replica, no maintenance window long enough to fake one, and real traffic the entire way through. Before touching a single command, mapping the required path surfaced two problems that don’t announce themselves: an encryption key gap that fails silently instead of loudly, and a database base image that had quietly stopped being maintained past version 15. Neither would have shown up in a changelog. Both would have shown up mid-upgrade if I hadn’t gone looking first.

## No Room to Cut the Power

If you’ve ever done electrical work, you know the rule: cut the power first, test for voltage, then touch the wire. I didn’t get that option. This GitLab instance has carried real production traffic — real merge requests, real CI pipelines, real people shipping code on an ordinary Tuesday — for three years, with no budget for a staging environment that mirrors production and no maintenance window long enough to fake one. Everything that follows had to happen **live**.

The trigger wasn’t optional, either. **CVE-2026–19478**, CVSS 9.4, let an unauthenticated attacker remotely modify or delete public projects and user data through a GraphQL injection flaw. A lower-severity CSRF issue, **CVE-2026–19650**, rode along with it. The fixes landed in 19.2.4, 19.1.6, 19.0.8, and 18.11.11 — all several major versions past where this instance was sitting.

## The Plan, in One Sentence

Map the full required path before touching anything, hunt down whatever fails **silently** rather than loudly, and never start a risky step without already knowing how to walk it back.

## Quick Start: Mapping Your Own Required Path

Three things needed answering before any real work started: the current version, the official required stops between it and the target, and anything the upgrade scripts silently assume already exists.

```
# 1. Confirm the version you're actually running
docker exec -it <gitlab-container> cat /home/git/gitlab/VERSION

# 2. Cross-check it against GitLab's official upgrade path tool
#    (gitlab-com.gitlab.io/support/toolbox/upgrade-path) to get
#    the list of required stops between current and target version
# 3. Grep your compose file for the encryption keys GitLab expects
#    to already exist - missing ones can fail silently
grep -E "SECRET_KEY_BASE|OTP_KEY_BASE|DB_KEY_BASE|ENCRYPTED_SECRETS" docker-compose.yml
```

That third command turned out to matter more than the first two combined.

## The One Landmine Worth Explaining: Keys That Fail Silently

The compose setup here only ever defined three legacy secrets — `GITLAB_SECRETS_DB_KEY_BASE`, `SECRET_KEY_BASE`, and `OTP_KEY_BASE`. Miss any of those three, and GitLab refuses to start. Loud failure, easy to catch, nothing to plan around.

Newer GitLab versions also expect a separate set of **Active Record encryption keys** — and those behave nothing like the legacy three. If they’re missing, GitLab doesn’t error out at all. Rails just generates them on the fly and writes them into `secrets.yml` **inside the running container**, a file that was never in any volume mount. The moment that container gets rebuilt — which is precisely what an upgrade does — those keys disappear, along with anything encrypted with them.

This is the kind of bug that never shows up in a health check or a changelog. It shows up months later as data that quietly stopped being decryptable, with nothing left pointing back to why. The only reason it surfaced here at all was going looking for what the scripts assumed already existed, rather than waiting for something to complain.

## The Path Itself: Why the Stops Aren’t About Distance

The path came out to eight mandatory stops: 17.5.5, 17.8.7, 17.11.7, 18.2.8, 18.5.7, 18.8.11, 18.11.11, and finally 19.2.4. The first assumption was that these stops existed because jumping too many major versions at once is inherently unsafe. That’s not quite right. GitLab’s own documentation frames it differently: **upgrade to the required stop, let the background migrations finish, then upgrade to the next stop.** The stop isn’t a buffer against version distance — it’s a checkpoint guaranteeing the database has finished converting itself before the code that reads it changes underneath it. Skip one, and new application code can end up running against a half-migrated schema.

Two more findings shaped the plan before execution even started. The PostgreSQL base image in use, `sameersbn/postgresql`, tops out at version 15 on Docker Hub — no 16, no 17, and the upstream project has since pointed newer deployments at a community-maintained fork instead. Missing that before the database-upgrade stations would have meant discovering a dead end mid-upgrade, service already stopped. On the reassuring side, `/data/postgresql/` still held both a `12/` and a `15/` directory side by side, along with a leftover `analyze_new_cluster.sh` — the fingerprint `pg_upgrade` leaves behind. This exact machine had already survived one major PostgreSQL version jump before, using the same mechanism about to be relied on again.

Scheduling wasn’t a guess, either. Pulling real hourly job counts found a genuine lunch-hour lull — 90 jobs at noon against 620–989 in the surrounding hours — and high-risk database stations got aligned to land right before the existing hypervisor snapshot window, so every risky step had a fresh disaster-recovery point sitting immediately behind it.

## Under the Hood

```
+------------------------+--------------------------------------------+------------------------------------------------+
| Item                   | What I Did                                  | Why It Mattered                                  |
+------------------------+--------------------------------------------+------------------------------------------------+
| Required stops         | Pulled the official 8-stop path instead of  | Each stop lets background migrations finish,    |
|                        | assuming version distance = risk            | not an arbitrary safety buffer                   |
+------------------------+--------------------------------------------+------------------------------------------------+
| Encryption keys        | Grepped the compose file for what the       | Missing AR keys fail silently and can cause      |
|                        | upgrade scripts silently assume exists      | permanent, undetected data loss                  |
+------------------------+--------------------------------------------+------------------------------------------------+
| DB base image          | Verified image tag availability on Docker   | Avoided finding a dead end mid-upgrade with the  |
|                        | Hub before relying on it                    | service already stopped                          |
+------------------------+--------------------------------------------+------------------------------------------------+
| Historical precedent   | Checked the data directory for evidence of  | Confirmed the upgrade mechanism had already      |
|                        | a prior successful PG upgrade               | worked once on this exact machine                |
+------------------------+--------------------------------------------+------------------------------------------------+
| Scheduling             | Pulled real hourly job counts instead of    | Found the actual lowest-traffic hour, aligned    |
|                        | guessing a quiet window                     | high-risk steps with existing DR snapshots       |
+------------------------+--------------------------------------------+------------------------------------------------+
```

## What Actually Worked

Going looking for what the upgrade scripts silently assumed — rather than waiting for something to throw an error — was what turned this from a plan with blind spots into one without them. The AR encryption key gap and the dead-ended base image would both have surfaced anyway, just later, and both times mid-upgrade with the service already interrupted. Treating “quiet lunch hour, verified with real numbers” and “probably quiet around lunch” as two different plans, not the same one with extra steps, was worth the ten minutes it took to pull the query.

## Where This Still Falls Short

None of this made the upgrade itself risk-free — it just meant these particular problems weren’t being discovered for the first time during a live maintenance window. Whether the mechanism that worked once before on this machine would still hold up across eight more stops, whether something else was hiding the same way the encryption keys were, and what would actually happen the first time a station ran long: none of that was answerable from planning alone. That’s what the rest of this series is about.

Have you ever found a landmine like this — something that fails silently instead of loudly, and only turns up if you go looking for it before something else forces the issue?

Live Wire: A Solo GitLab Upgrade Log ｜ Series overview: [Live Wire — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [The Runner Audit](https://jason-chen-0604.medium.com/the-runner-audit-43-runners-one-column-everyone-trusts-one-wrong-answer-7155e795ce1c)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
