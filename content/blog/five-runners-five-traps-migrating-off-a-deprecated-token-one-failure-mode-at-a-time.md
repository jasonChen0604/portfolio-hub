---
title: "Five Runners, Five Traps: Migrating Off a Deprecated Token, One Failure Mode at a Time"
slug: "five-runners-five-traps-migrating-off-a-deprecated-token-one-failure-mode-at-a-time"
author: "Jason Chen"
publishedAt: "2026-09-03"
excerpt: "Legacy registration tokens are on their way out, and five active runners needed to move to the newer authentication-token model before the upgrade path could..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/five-runners-five-traps-migrating-off-a-deprecated-token-one-failure-mode-at-a-time-05b10e070f58"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*qOSLxZYty8nLnD4EkmRzcA.png"
series: { name: "gitlab", part: 3 }
---

*Live Wire: A Solo GitLab Upgrade Log — One migration task, five runners, and five completely unrelated reasons it broke along the way.*

![](https://miro.medium.com/v2/resize:fit:1400/1*qOSLxZYty8nLnD4EkmRzcA.png)

> This is Part 3 of "Live Wire: A Solo GitLab Upgrade Log" Previous: [The Runner Audit: 43 Runners, One Column Everyone Trusts, One Wrong Answer](https://jason-chen-0604.medium.com/the-runner-audit-43-runners-one-column-everyone-trusts-one-wrong-answer-7155e795ce1c) ｜ Series overview: [Live Wire: A Solo GitLab Upgrade Log — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Ready the Foundation: 170GB Reclaimed and One Wrong Assumption Corrected Before the Upgrade Started](https://jason-chen-0604.medium.com/ready-the-foundation-170gb-reclaimed-and-one-wrong-assumption-corrected-before-the-upgrade-started-1e8cbe4f22b5)

## TL;DR

Legacy registration tokens are on their way out, and five active runners needed to move to the newer authentication-token model before the upgrade path could start. Every one of the five migrations failed for a different reason — a Rails field that doesn’t update the way its name implies, an authorization model that doesn’t auto-extend to new projects, a CI image missing a binary, an access-token scope that was too narrow, and a CLI that refused to let a deleted runner unregister cleanly. None of the fixes transferred from one runner to the next. The one thing that did transfer: verifying success by checking real job traffic afterward, not just “the registration command didn’t error.”

## Why This Couldn’t Wait

GitLab’s legacy runner registration tokens are being phased out, and five runners on the fleet were still using them. Migrating to the newer authentication-token model was the kind of task that looked procedural — deregister, reconfigure, reregister — until each runner turned out to have its own way of not cooperating.

## The Plan, in One Sentence

Migrate each runner individually, verify with real job traffic rather than a clean registration message, and treat each failure as its own investigation instead of assuming the first fix would generalize.

## Quick Start: Checking a Runner’s Registration Type and Health

```
# Confirm whether a runner's process is actually communicating,
# independent of what ci_runners.contacted_at claims
sudo gitlab-runner --debug run
# let it run in the foreground for ~20-30 seconds, then Ctrl+C —
# watch for real poll requests and their response codes, not just "started"
```

```
# Check which projects/groups a runner is actually authorized against
SELECT runner_id, project_id FROM ci_runner_projects WHERE runner_id IN (<ids>);
SELECT runner_id, namespace_id FROM ci_runner_namespaces WHERE runner_id IN (<ids>);
```

*None of the five traps lived in the same part of the stack*

The first runner’s config got hand-edited directly. `gitlab-runner verify` came back valid, the TOML syntax checked out, and yet `ci_runners.contacted_at` stopped updating entirely — which looks exactly like a dead process. Running `gitlab-runner --debug run` in the foreground for about 25 seconds and then killing it showed the truth: the runner **was** polling, it just kept getting `204 No Content` back — no job matched, nothing to run. `contacted_at` doesn't update on every poll the way its name implies. A runner can be completely healthy and still look, from that one column, exactly like a dead one.

## Trap 2: A Brand-New Project, and an Authorization Model That Doesn’t Assume Anything

The second runner appeared unable to pick up jobs from a freshly created test project. It wasn’t broken — **project-type runners don’t automatically apply to new projects**, GitLab requires explicit authorization per project regardless of whether the runner is old or newly registered. Querying `ci_runner_projects` confirmed it directly: zero rows for any of the six runners involved, old and new alike.

That finding turned into an architecture decision rather than a one-off fix: switch from project-type to **group-type runners**, authorizing an entire group tree at once instead of adding projects one at a time as they come up. One authorization step instead of an indefinite, growing list of individual project grants.

## Trap 3: A Job Image With No `docker` Inside It

```
/bin/sh: eval: line 146: docker: not found
```

Exit code 127. The CI job’s own container — a plain Alpine image — simply didn’t have the Docker CLI installed, and the job needed it. The fix was mundane once found: point the job at an image that actually ships the client, like `docker:27.1.1`, instead of assuming a minimal base image comes with tools it was never built to have.

## Trap 4: A 404 Page and a Token That Wasn’t Allowed to Answer

Creating a group-level runner led to a 404 on the page meant to display its authentication token. The actual cause was one scope short: the **Personal Access Token** used to call the API only had `admin_mode`, not `api` — and GitLab's own self-check endpoint (`GET /api/v4/personal_access_tokens/self`) rejected the call before it ever reached the token page.

```
curl -sk -X POST -H "PRIVATE-TOKEN: <PAT>" \
  https://localhost/api/v4/runners/249/reset_authentication_token
# {"token":"glrt-xxxx","token_expires_at":null}
```

Once the PAT had the right scope, the token could be pulled directly through this endpoint — sidestepping the broken page entirely rather than debugging why it 404'd.

## Trap 5: GitLab Won’t Let a Deleted Runner Leave Gracefully

```
ERROR: Unregistering runner from GitLab forbidden  status=DELETE .../api/v4/runners/managers: 403 Forbidden
```

Once a runner had already been deleted server-side, asking the local `gitlab-runner` process to unregister it hit a 403 — there was nothing left on the server to unregister *from*. The workaround skipped the API path entirely: a small Python script that opened the local `config.toml`, split it on each `[[runners]]` block boundary using `re.split(r'(?=\[\[runners\]\])', content)`, and removed the matching block as a plain text edit.

## The Honest Part: One of These Went Wrong on Its Own

Not every mistake here belonged to GitLab. One runner — the fourth in the batch — got rebuilt from scratch after a 404 was misread as “this registration failed,” when the underlying registration had actually gone through fine. The rebuild wasn’t harmful, but it left a duplicate-looking ID naming pattern that took a moment to untangle afterward. Worth saying plainly: not every wrong turn in this project came from GitLab’s side of things.

## Verifying With Real Traffic, Not a Clean Exit Code

```
SELECT
  b.runner_id,
  COUNT(*) AS job_count,
  MIN(b.created_at) AS first_job,
  MAX(b.created_at) AS last_job,
  COUNT(*) FILTER (WHERE b.status = 'failed') AS failed_count
FROM ci_builds b
WHERE b.runner_id IN (249,250,251,252,253)
GROUP BY b.runner_id
ORDER BY b.runner_id;
```

Every one of the five runners showed real job activity afterward — between 11 and 24 jobs each, with a handful of failures on each. Those failures got checked individually too, and traced back to business-logic issues in the pipelines themselves (a `pytest` collection error, a Django CVE scan catching something real) rather than anything wrong with the runners. "It registered without an error" and "it's actually doing its job correctly" turned out to be two different claims, and only the second one was the point.

## A Bonus Find: Sizing a Runner by What It Actually Does

While re-registering a separate, higher-volume runner, its concurrency settings got a second look instead of being carried over unchanged. It was configured for `concurrent=12` / `limit=12`. Measuring actual peak concurrency — using an interval-overlap query across a week of real job history — showed the true peak was **6** simultaneous jobs at any single moment, against roughly 692 total jobs over that week (about 99 a day). The configured ceiling had been double the real one for who knows how long. It got resized down to 8 on re-registration: enough headroom above the observed peak, without carrying capacity that was never being used.

## Under the Hood

```
+------------------------+---------------------------------------------+------------------------------------------------+
| Trap                   | Root Cause                                    | Fix                                              |
+------------------------+---------------------------------------------+------------------------------------------------+
| 1. Silent runner        | contacted_at doesn't update on every poll     | Verified with gitlab-runner --debug run in       |
|                         |                                                | the foreground instead of trusting the column    |
+------------------------+---------------------------------------------+------------------------------------------------+
| 2. New project, no jobs | Project-type runners need per-project         | Switched to group-type runners, authorized       |
|                         | authorization, even for identical runners     | the whole group tree at once                     |
+------------------------+---------------------------------------------+------------------------------------------------+
| 3. docker: not found    | CI job image had no Docker CLI installed      | Pointed the job at an image that ships one       |
+------------------------+---------------------------------------------+------------------------------------------------+
| 4. 404 on token page    | PAT missing the "api" scope                   | Pulled the token directly via the                |
|                         |                                                | reset_authentication_token endpoint              |
+------------------------+---------------------------------------------+------------------------------------------------+
| 5. 403 on unregister    | Server-side runner already deleted, nothing   | Removed the local config.toml block directly     |
|                         | left to unregister from via the API           | with a text-boundary script                      |
+------------------------+---------------------------------------------+------------------------------------------------+
```

## What Actually Worked

Treating each failure as its own investigation, instead of assuming the fix for runner one would apply to runner two, was the only approach that actually held up — none of the five root causes had anything in common. Verifying with real `ci_builds` traffic afterward, rather than trusting a clean registration message, was what caught that the failures showing up post-migration were pipeline issues, not runner issues — a distinction that would have been easy to get backwards under time pressure.

## Where This Still Falls Short

This covers getting five runners onto the new token model and confirming they work — it doesn’t say anything about whether the runners that remain are configured well beyond concurrency, or whether the group-level authorization decision will need revisiting as more projects get added under those groups. The rebuilt runner from Trap 5 also never got a clean explanation for why the 404 happened in the first place — it got worked around, not root-caused, and that’s an honest gap rather than a resolved one.

Have you ever had a batch of “identical” migrations turn out to have zero shared root causes between them?

Live Wire: A Solo GitLab Upgrade Log ｜ Previous: [The Runner Audit](https://jason-chen-0604.medium.com/the-runner-audit-43-runners-one-column-everyone-trusts-one-wrong-answer-7155e795ce1c) ｜ Series overview: [Live Wire — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Ready the Foundation](https://jason-chen-0604.medium.com/ready-the-foundation-170gb-reclaimed-and-one-wrong-assumption-corrected-before-the-upgrade-started-1e8cbe4f22b5)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
