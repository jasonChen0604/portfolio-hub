---
title: "Station 3: GitLab Behaved, I Didn't"
slug: "station-3-gitlab-behaved-i-didnt"
author: "Jason Chen"
publishedAt: "2026-09-07"
excerpt: "Station 3–17.8.7 to 17.11.7 — was the cleanest version bump so far: database size actually shrank slightly from orphan-data cleanup, and the largest migrated..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/station-3-gitlab-behaved-i-didnt-276a0b610c32"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*0MH6cF3YX5FpTHJvw5yXjg.png"
series: { name: "gitlab", part: 7 }
---

*Live Wire: A Solo GitLab Upgrade Log — The version upgrade itself went perfectly. Sudo, shell escaping, and an overzealous grep filter took up the entire afternoon instead.*

![](https://miro.medium.com/v2/resize:fit:1400/1*0MH6cF3YX5FpTHJvw5yXjg.png)

> This is Part 7 of "Live Wire: A Solo GitLab Upgrade Log" Previous: [Station 1–2: The Estimation Trap](https://jason-chen-0604.medium.com/station-1-2-the-estimation-trap-9c040df45db6) ｜ Series overview: [Live Wire: A Solo GitLab Upgrade Log — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Station 4: The Day Before the Six Minutes](https://jason-chen-0604.medium.com/station-4-the-day-before-the-six-minutes-a8eb0c03760c)

## TL;DR

Station 3–17.8.7 to 17.11.7 — was the cleanest version bump so far: database size actually shrank slightly from orphan-data cleanup, and the largest migrated table was a fraction of Station 2’s size. None of that mattered for how the afternoon actually went. Four separate operational problems — a permissions error, a misunderstanding about `sudo`, a SQL quoting mistake, and a `grep` filter that deleted its own good output — ate more time than the upgrade itself.

## The Part That Went Right

Station 3’s content was almost boring by this series’ standards: `db_size` moved from 4330MB to 4056MB, a 274MB decrease from migrations that included orphaned-data cleanup — expected, not alarming. The largest table involved was roughly 79,336 rows, a fraction of Station 2's 319,000-row tables. If the whole plan had been graded purely on "did the GitLab upgrade itself go smoothly," this station would be a non-event.

## The Fix, in One Sentence

None of these four problems needed a clever fix — they needed a consistent, boring pattern applied every time: force an interactive shell for sudo, route complex SQL through a file instead of an inline string, and stop stacking broad `grep -v` filters on top of each other.

## Trap 1: A Directory Owned by Root, and a Permission Error That Looked Wrong

```
ssh Gitlab "cp docker-compose.yml docker-compose.yml.bak ..."
# Permission denied
```

The confusing part wasn’t the error — it was that the same account could clearly *read* everything in that directory just fine. The actual cause: `~/gitlab` was owned by `root` with `755` permissions. The automation account could read the directory's contents, but creating or writing a new file inside it required more than read access, which a plain non-interactive `ssh` command doesn't get around on its own.

## Trap 2: Docker Group Membership Doesn’t Mean What It Sounds Like

Adding the automation account to the `docker` group solved exactly one problem: the non-interactive cron environment's access to the Docker socket. It did **not** mean every `docker-compose` command could now skip `sudo`. The interactive `docker-compose` operations used during the actual upgrade still needed `sudo -S` wrapped around them — group membership and interactive privilege escalation turned out to be two separate concerns that just happened to look related.

## Trap 3: A Pair of Double Quotes, Read the Way PostgreSQL Reads Them

```
SELECT count(*) FROM users WHERE state="active"
```

```
ERROR: column "active" does not exist
```

This looks like a shell-escaping problem. It isn’t. PostgreSQL treats double quotes as **identifier delimiters**, not string delimiters — `"active"` is read as a column name, not a value. Strings need single quotes in PostgreSQL, full stop; no amount of shell-escaping discipline changes that syntax rule.

## Trap 4: A Grep Filter That Deleted the Good News Along With the Noise

The `sudo` prompt (`[sudo] password for ...:`) had a habit of landing on the same line as the actual command output that followed it. A `grep -v` rule written to filter out that prompt line ended up filtering out the legitimate JSON output stuck right after it on the same line — silently discarding a successful result while looking, from the terminal, like nothing had gone wrong.

## The Fix That Applied to All Four

```
# Force an interactive shell so ~/.bashrc's password variable is actually readable
ssh Host "bash -ic 'echo \$SUDO_PASS | sudo -S <command>'"
```

Every `sudo`-dependent remote command switched to this pattern — `bash -ic` forces an interactive shell specifically so the password variable defined in `.bashrc` is actually available to read.

```
# Complex SQL: write to a remote temp file via heredoc, copy into the
# container, run it with psql -f — sidesteps escaping entirely
```

Any SQL more complex than a one-liner stopped being typed inline and started going through a temp file instead, removing the quoting problem at its root rather than trying to escape around it correctly every time.

For filtering, the fix was precision instead of exclusion: reaching for a targeted `grep -oP` that extracts exactly the expected format, instead of stacking increasingly broad `grep -v` rules trying to exclude everything unwanted.

## Under the Hood

```
+-------------------------+----------------------------------------------+---------------------------------------------------+
| Trap                     | Root Cause                                     | Fix                                                  |
+-------------------------+----------------------------------------------+---------------------------------------------------+
| 1. Permission denied      | Directory owned by root; account has read-     | N/A here — required routing writes through a        |
|                           | only access via plain non-interactive SSH       | privileged path instead                              |
+-------------------------+----------------------------------------------+---------------------------------------------------+
| 2. Still needed sudo      | docker group only fixed the non-interactive     | Kept sudo -S for all interactive docker-compose      |
|                           | cron socket permission, nothing else            | commands regardless of group membership              |
+-------------------------+----------------------------------------------+---------------------------------------------------+
| 3. SQL quoting error      | Double quotes are identifiers in PostgreSQL,    | Routed complex SQL through heredoc + temp file       |
|                           | not string delimiters — a syntax rule, not      | + psql -f instead of inline strings                  |
|                           | an escaping bug                                  |                                                       |
+-------------------------+----------------------------------------------+---------------------------------------------------+
| 4. grep ate good output   | Broad grep -v rule matched a line containing     | Switched to precise grep -oP for expected format     |
|                           | both the sudo prompt and real output              | instead of stacking exclusion rules                   |
+-------------------------+----------------------------------------------+---------------------------------------------------+
```

## What Actually Worked

Standardizing one `bash -ic` pattern for every remote `sudo` call, and moving every non-trivial SQL statement into a file instead of an inline string, turned four separate one-off debugging sessions into two boring, repeatable habits. Neither fix was clever — that was the point. The goal wasn't finding a smarter workaround, it was removing the conditions that let each mistake happen again.

## Where This Still Falls Short

None of these four problems reflected badly on GitLab or on the upgrade plan — they were entirely self-inflicted tooling friction, and it’s worth saying so plainly rather than dressing up ordinary shell mistakes as something more interesting than they were. This station also didn’t leave anything unresolved: by the end of the afternoon, all four patterns were fixed and folded into the standard operating procedure used for every station since.

Have you ever had the “hard” part of a task go perfectly, while the “easy” part — the shell scripting around it — ate the entire afternoon instead?

Live Wire: A Solo GitLab Upgrade Log ｜ Previous: [Station 1–2: The Estimation Trap](https://jason-chen-0604.medium.com/station-1-2-the-estimation-trap-9c040df45db6) ｜ Series overview: [Live Wire — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Station 4: The Day Before the Six Minutes](https://jason-chen-0604.medium.com/station-4-the-day-before-the-six-minutes-a8eb0c03760c)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
