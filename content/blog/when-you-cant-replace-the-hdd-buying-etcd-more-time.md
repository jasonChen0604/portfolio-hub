---
title: "When You Can't Replace the HDD: Buying etcd More Time"
slug: "when-you-cant-replace-the-hdd-buying-etcd-more-time"
series: { name: "k3s", part: 13 }
author: "Jason Chen"
publishedAt: "2026-08-19"
excerpt: "k3s Series #13 — I assumed etcd and Longhorn were fighting over the same disk. They weren't even on the same physical drive."
tags: ["Kubernetes", "K3s", "Etcd", "Performance", "DevOps"]
sourceUrl: "https://jason-chen-0604.medium.com/when-you-cant-replace-the-hdd-buying-etcd-more-time-bd5d3d852629"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*_zSWDkVaDfc7LS5GIn2vJg.png"
---

*k3s Series #13 — I assumed etcd and Longhorn were fighting over the same disk. They weren't even on the same physical drive.*

![](https://miro.medium.com/v2/resize:fit:1400/1*_zSWDkVaDfc7LS5GIn2vJg.png)

This is Part 13 of "Running Production Solo: My k3s High-Availability Journey" — Previous: [Part 12 — Your k3s HA Might Be Fake: How a Traditional HDD Quietly Undermines etcd](https://jason-chen-0604.medium.com/your-k3s-ha-might-be-fake-how-a-traditional-hdd-quietly-undermines-etcd-7ad25d4771b9) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 14 — Containerd Filled the System Disk: A Two-Phase, Minimal-Downtime Migration](https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3)

## TL;DR — and what this post honestly is

The last post found etcd's fsync latency running dangerously past its own threshold on this hardware. The real fix is an SSD, and an SSD wasn't available yet. This post is what I actually did in the meantime: disproving my own first theory about the cause, then applying the handful of changes that genuinely help without pretending any of them are a substitute for faster storage. I'm also including the list of things I looked at and chose *not* to do, because that list is as useful as the one that worked.

## The Theory That Felt Obviously Right, and Was Wrong

My first assumption, the moment the fsync numbers came back bad, was that etcd and Longhorn were fighting over the same physical disk — two different I/O-heavy processes, same spinning platter, contention explaining the slowness. It's a clean story, and it's the kind of theory that feels true enough that it's tempting to just act on it. Checking the actual disk layout first turned out to matter: etcd lived on /dev/sdb3, the system disk. Longhorn's data lived on /dev/mapper/vg0-lv--data, backed by sda. **Two entirely separate physical disks.** There was no contention to fix, because there was nothing sharing a resource in the first place.

Confirming that with an actual benchmark, rather than just trusting the block device layout, closed the question completely:

```
# Same fsync-heavy write pattern against each disk independently
dd if=/dev/zero of=/testfile bs=8k count=1000 oflag=dsync
```

Both disks came back at almost exactly the same speed — **1.7 MB/s on sdb, 1.8 MB/s on sda**, working out to roughly **4.8ms per fsync on either one**. That's not what contention looks like. That's what "these are both the same class of slow hardware" looks like. Moving etcd's data directory to a different partition, or carving out a fresh logical volume, would have accomplished nothing — the destination would have been exactly as slow as the source, because it's the same underlying medium either way. This single benchmark saved a genuinely tempting, genuinely useless afternoon of disk migration.

## The Fix, in One Sentence

Since the disk itself can't get faster without new hardware, reduce how often etcd has to hit that slow disk and raise its tolerance for the latency it can't avoid — buying time, not solving the underlying problem.

## Quick Start: What Actually Helps

**Zero-risk tuning first** — reducing how aggressively the kernel batches dirty pages, which matters more on a slow disk where a full write queue means fsync waits behind everything else ahead of it:

```
# /etc/sysctl.d/99-etcd-hdd.conf
vm.dirty_ratio = 10
vm.dirty_background_ratio = 5
```

**The change that actually addresses the symptom directly** — widening etcd's tolerance for slow disk responses, so it stops mistaking "this write is just slow" for "this node is unreachable":

```
# /etc/rancher/k3s/config.yaml on each server
etcd-arg:
  - "heartbeat-interval=300"   # default: 100
  - "election-timeout=3000"    # default: 1000
```

This is the parameter that actually matters for HDD-backed etcd. The default heartbeat and election timeouts assume disk latency in the range fast storage provides; widening both gives etcd room to tolerate a slow fsync without immediately concluding a healthy node has gone unreachable and triggering an unnecessary raft election — directly reducing the odds of a **false loss-of-quorum event** under exactly the kind of IO pressure spike the previous post warned about.

**A verification gotcha worth knowing about:** these settings won't show up if you check the running etcd process's command line the way you normally would — because k3s runs etcd embedded inside its own process, not as a separately invokable binary with its own visible argv. To actually confirm the settings took effect:

```
cat /var/lib/rancher/k3s/server/db/etcd/config
# or check the node-args annotation on the Node object
kubectl get node <node-name> -o jsonpath='{.metadata.annotations.k3s\.io/node-args}'
```

## What I Looked At and Chose Not to Do

This section matters as much as the one above it, because knowing when *not* to act on an available lever is its own skill, and I want to be honest about where I stopped rather than listing every possible etcd tuning knob as if I'd flipped them all.

**Shortening the events TTL** — a common suggestion for reducing etcd write volume. Checked first: `kubectl get events -A | wc -l` came back at **5**. There was no meaningful write pressure coming from events on this cluster; tuning a knob that doesn't move the needle isn't worth the added complexity.

**Running an etcd defrag.** The database showed a genuinely striking-looking ratio — 34MB logical size against 399MB physical, roughly 11x fragmentation. But the absolute numbers matter more than the ratio: a few hundred megabytes is nothing to actually defragment, and k3s's embedded etcd doesn't ship the etcdctl binary needed to run the operation, meaning it would need to be downloaded separately just to address a problem that isn't actually costing anything measurable at this size. Low value for the effort and risk involved.

**--unsafe-no-fsync.** This exists, and it would genuinely make etcd fast on this hardware — by skipping the fsync guarantee entirely. It would also mean losing data on any unexpected power loss, which is precisely the failure mode etcd's fsync requirement exists to protect against in the first place. Not a real option for anything running in production, regardless of how tempting the performance number looks on paper.

## Under the Hood

| Change | Effect | Status |
|---|---|---|
| vm.dirty_ratio / dirty_background_ratio | Reduces write-queue buildup on the slow disk | Applied — zero risk |
| heartbeat-interval / election-timeout | etcd tolerates slow fsync without false-positive raft elections | Applied — the actual fix for this symptom |
| events TTL | Would reduce etcd write volume | Skipped — only 5 events, no measurable pressure |
| etcd defrag | Would reduce physical DB size | Skipped — absolute size too small to matter, needs separately-downloaded tooling |
| --unsafe-no-fsync | Would make fsync fast | Rejected — data loss risk on power failure, never in prod |

## What Actually Worked

The habit that mattered most here was **benchmarking the theory before acting on it** — the contention story felt right enough to act on immediately, and a five-minute dd test would have been easy to skip in favor of just doing the disk migration the theory implied. Skipping that test would have cost real time on a fix that couldn't have worked. The other thing worth keeping: being willing to write "I looked at this and chose not to do it" instead of quietly doing every available optimization to look thorough — the defrag and events-TTL sections above are worth exactly as much to a reader as the ones that worked.

## Where This Still Falls Short — Said Plainly, on Purpose

None of this makes fsync fast. **Nothing here moves the actual latency number** — 14ms stays 14ms; that only changes with an SSD. What this buys is a reduced chance of hitting the failure mode that slow fsync causes, and more tolerance for it when it happens anyway. That's a real, meaningful difference from "the problem is fixed," and I don't want this post to read as more reassuring than it should. If you're reading this because you're in the same position — hardware you can't replace yet, but a cluster you still need to trust — this is what buying time actually looks like: specific, bounded, and honest about what it isn't.

Have you had to mitigate a hardware limitation you couldn't fix directly? What was the honest ceiling on how much the mitigation actually bought you?

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)
- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)
- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
