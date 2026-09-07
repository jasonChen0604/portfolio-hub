---
title: "The Image That Wouldn't Die: Tracing a Stuck Deletion to a Protocol-Level Lie"
slug: "the-image-that-wouldnt-die-tracing-a-stuck-deletion-to-a-protocol-level-lie"
author: "Jason Chen"
publishedAt: "2026-09-04"
excerpt: "Deleting a container image repository through GitLab’s UI produced the expected “scheduled for deletion” message — and then nothing happened for days. The..."
tags: ["Gitlab", "DevOps", "Self Hosted", "Site Reliability", "Software Engineering"]
sourceUrl: "https://jason-chen-0604.medium.com/the-image-that-wouldnt-die-tracing-a-stuck-deletion-to-a-protocol-level-lie-fccb95a8cf35"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*fAfeTxelpSHMnVNdXQfrmA.png"
series: { name: "gitlab", part: 5 }
---

*Live Wire: A Solo GitLab Upgrade Log — GitLab said the image was scheduled for deletion. Three days later, it still wasn’t gone. The reason lived one layer below the application, in a capability check nobody thinks to question.*

![](https://miro.medium.com/v2/resize:fit:1400/1*fAfeTxelpSHMnVNdXQfrmA.png)

> This is Part 5 of "Live Wire: A Solo GitLab Upgrade Log" Previous: [Ready the Foundation: 170GB Reclaimed and One Wrong Assumption Corrected Before the Upgrade Started](https://jason-chen-0604.medium.com/ready-the-foundation-170gb-reclaimed-and-one-wrong-assumption-corrected-before-the-upgrade-started-1e8cbe4f22b5) ｜ Series overview: [Live Wire: A Solo GitLab Upgrade Log — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Station 1–2: The Estimation Trap](https://jason-chen-0604.medium.com/station-1-2-the-estimation-trap-9c040df45db6)

## TL;DR

Deleting a container image repository through GitLab’s UI produced the expected “scheduled for deletion” message — and then nothing happened for days. The registry logs showed the real story: 58,818 failed delete requests in three hours, all failing with “digest invalid.” The actual root cause lived in GitLab’s own source code, in a capability probe that asked the registry “can you delete by tag?” and got an honest-sounding “yes” that turned out to be a lie the moment it was actually tested. This directly shapes a decision for a later station in this series: the Container Registry itself eventually needs to be swapped for one that doesn’t have this mismatch.

## A Delete Button That Worked, and Didn’t

Someone clicks delete on a container image repository. GitLab responds with **“This image repository is scheduled for deletion.”** That’s the expected behavior, the button did its job — except the image was still there, unchanged, three days later.

## The Fix, in One Sentence

Trace the failure from the database status, through the registry’s actual error logs, into GitLab’s own source code, and replace the broken deletion path with the one the registry actually supports.

## Quick Start: Where to Look First

```
-- Confirm what the database thinks is happening
SELECT id, project_id, status, delete_started_at
FROM container_repositories
WHERE status = 2;  -- delete_scheduled
```

```
# Then check what the registry itself is actually logging
sudo docker logs --since 3h gitlab-registry-1 | grep -c "digest invalid"
```

The first query showed two repositories stuck in `delete_scheduled`, with `delete_started_at` updating every few minutes — 08:27, then 08:31, then again a few minutes later — as if something kept retrying and never succeeding. The second command is where the actual scale of the problem became visible.

## The Registry Was Screaming the Whole Time

```
DELETE /v2/tqms/alpha/alpha-ai-agent/manifests/qas   HTTP/1.1
→ 400  err.code="digest invalid"
       err.message="provided digest did not match uploaded content"
       http.request.useragent="GitLab/17.4.2"
```

GitLab 17.4.2 was calling the delete endpoint using the image’s **tag name** (`/manifests/qas`). The registry running here — `registry:2.8`, the CNCF upstream image, not GitLab's own fork — only accepts a **digest** (`/manifests/sha256:...`) as a valid deletion reference. Every single delete attempt was failing at the protocol level, silently, and retrying forever.

```
sudo docker logs --since 3h gitlab-registry-1 | grep -c "digest invalid"
# 58818
```

**58,818 failed requests in three hours** — roughly 5.4 every second, all rejected the same way. And it wasn’t limited to the two manually deleted repositories: GitLab’s automatic cleanup policy had been hitting the exact same wall on a third repository, adding roughly 13,700 more failures in a single 10-minute window across all three.

## Reading the Source to Find Out Why

The failing calls weren’t random — GitLab believed it was allowed to delete by tag. That belief came from a specific function:

```
# lib/container_registry/client.rb:87-99
def supports_tag_delete?
  response = faraday.run_request(:options, '/v2/name/manifests/tag', '', {})
  response.success? && response.headers['allow']&.include?('DELETE')
end
```

Testing it directly showed the mismatch:

```
OPTIONS /v2/name/manifests/tag   → HTTP 200   (GitLab reads this as "tag delete is supported")
DELETE  /v2/<repo>/manifests/dev → HTTP 400   "digest invalid"   (fails every time it's actually tried)
```

Over a 30-minute window, **21,556 OPTIONS probes all came back 200.** The registry wasn’t malfunctioning — it was answering an `OPTIONS` capability check honestly by its own logic, while genuinely not supporting the operation GitLab inferred from that answer. The probe and the real behavior simply didn't agree, and nothing in the exchange ever surfaced that disagreement until an actual `DELETE` was attempted.

## The Fix: Bypass the Broken Path

With the real cause identified, the workaround skipped GitLab’s tag-based deletion path entirely and went straight to what the registry actually supports:

```
repo = ContainerRepository.find(369)
client = repo.client
repo.tags.each do |tag|
  client.delete_repository_tag_by_digest(repo.path, tag.digest)
end
```

```
tag=dev digest=sha256:9abf43b7... → delete_by_digest -> true
tag=qas digest=sha256:f6f71484... → delete_by_digest -> true
```

Deletion by digest worked immediately, every time — confirming the registry was never actually broken, just being asked the wrong way.

## One Repository, Deliberately Left Alone

A third affected repository — tied to a PRD/QAS environment — got a different call: **don’t delete anything, disable the cleanup policy instead** (`enabled: false`). The risk of an unintended deletion in a shared environment outweighed the benefit of clearing out stale images immediately. Leaving it untouched was the safer default until a proper fix exists.

## Before and After

```
+---------------------------+------------------+------------------+
| Metric                    | Before            | After             |
+---------------------------+------------------+------------------+
| digest invalid failures    | ~1,380 / minute   | 0                 |
+---------------------------+------------------+------------------+
| OPTIONS probes             | ~700 / minute     | 0                 |
+---------------------------+------------------+------------------+
| Repositories stuck          | 2                 | 0                 |
+---------------------------+------------------+------------------+
```

## Under the Hood

```
+-------------------------+--------------------------------------------+------------------------------------------------+
| Item                     | What I Did                                   | Why It Mattered                                  |
+-------------------------+--------------------------------------------+------------------------------------------------+
| Symptom                  | Confirmed via container_repositories status  | delete_started_at kept updating — something was |
|                          | that deletion was retrying, not stalled       | retrying, not simply stuck                        |
+-------------------------+--------------------------------------------+------------------------------------------------+
| Real failure signal       | Checked registry logs directly, not just      | Found the actual HTTP error hiding behind a       |
|                          | GitLab's UI state                             | generic "scheduled for deletion" message           |
+-------------------------+--------------------------------------------+------------------------------------------------+
| Root cause                | Read GitLab's own source for the capability   | Found the exact probe whose false positive         |
|                          | check driving the delete method choice         | caused every retry to fail                          |
+-------------------------+--------------------------------------------+------------------------------------------------+
| Fix                       | Deleted by digest via Rails console instead    | Bypassed the broken tag-based path entirely,       |
|                          | of the tag-based path GitLab defaults to        | using what the registry actually supports          |
+-------------------------+--------------------------------------------+------------------------------------------------+
```

## What Actually Worked

Checking the registry’s own logs instead of trusting GitLab’s UI status was what turned an invisible retry loop into a readable error message. Reading the actual source code for the capability check — rather than assuming the registry itself was simply broken — was what found a root cause that a support forum search never would have surfaced.

## Where This Still Falls Short

This is a stop-the-bleeding fix, not a root-cause fix, and it’s worth being direct about that. The actual mismatch is between the CNCF upstream registry image in use here and the assumptions GitLab’s own client makes about it — the real resolution is switching to GitLab’s own registry fork, which doesn’t have this gap. That swap is deliberately scheduled for the final station in this series, once every other stop has landed safely, rather than being rushed in now. Until then, the two originally stuck repositories are clean, and the third stays exactly as it was — untouched, on purpose, not by oversight.

Have you ever had two systems each behave correctly by their own logic, and only discovered the gap between them by reading the source instead of the docs?

Live Wire: A Solo GitLab Upgrade Log ｜ Previous: [Ready the Foundation](https://jason-chen-0604.medium.com/ready-the-foundation-170gb-reclaimed-and-one-wrong-assumption-corrected-before-the-upgrade-started-1e8cbe4f22b5) ｜ Series overview: [Live Wire — Series Overview](https://jason-chen-0604.medium.com/live-wire-a-solo-gitlab-upgrade-log-series-overview-7a5ecd66d89b) ｜ Next: [Station 1–2: The Estimation Trap](https://jason-chen-0604.medium.com/station-1-2-the-estimation-trap-9c040df45db6)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
