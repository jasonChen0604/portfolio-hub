---
title: "The Moment a Single Node Couldn’t Keep Up: It Started With a Capacity Report"
slug: "the-moment-a-single-node-couldnt-keep-up-it-started-with-a-capacity-report"
author: "Jason Chen"
publishedAt: "2026-08-06"
excerpt: "k3s Series 1 — An automated risk report turned my “it’s probably fine” instinct into a red Critical label A single node is a single point of failure — the fi..."
tags: ["Kubernetes", "K3s", "DevOps", "Self Hosting", "Site Reliability"]
sourceUrl: "https://jason-chen-0604.medium.com/the-moment-a-single-node-couldnt-keep-up-it-started-with-a-capacity-report-5367c7ea1edc"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*22kbdoO556QZWoDG9JBh2g.png"
---

k3s Series #1 — *An automated risk report turned my “it’s probably fine” instinct into a red Critical label*

![](https://miro.medium.com/v2/resize:fit:1400/1*22kbdoO556QZWoDG9JBh2g.png)

*A single node is a single point of failure — the first crack this series sets out to fix*

This is Part 1 of the series “Running Production Solo: My k3s High-Availability Journey” Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 2 — From 1 Node to 3: The Full Story of Building Out Longhorn](https://jason-chen-0604.medium.com/from-1-node-to-3-the-full-story-of-building-out-longhorn-3b26f3f45e60)

## TL;DR

I self-hosted a k3s production environment, ran it on a single node for a while, and everything felt fine. Then I had Claude Code generate a **capacity report**, and discovered this “fine” cluster was quietly sitting on several **Critical**-level risks — including a kubelet with no memory eviction threshold at all, meaning the OOM Killer could kill the k3s server process itself at any time. This post walks through how I quantified the problem, hardened the kubelet step by step, and the pitfalls I hit along the way.

## One Machine Doing Everything, Until Someone Runs the Numbers

The best part of self-hosting k3s is that **one machine can spin up something that looks like a real Kubernetes cluster**. You install it, throw a few services on, it works — that feeling is hard to beat. The problem is there’s a gap between “it works” and “this is production-ready,” and that gap is something you can’t normally see: **the capacity ceiling**.

A single node is like running a diner solo — you’re the cook, the server, and the cashier all at once. Slow days feel great, you might even feel like you’ve got this handled. But you never actually know where the breaking point is until three tables show up at once, the pan burns, the register freezes, and nobody’s covering the floor — and it always happens at the worst possible time.

Instead of trusting my gut on where that breaking point was, I had Claude Code run a **read-only capacity assessment** first, turning a vague sense of unease into a quantified, ranked list of risks.

## The Fix, in One Sentence

Write a **read-only assessment script** that collects data from both the hardware layer and the actual kubelet configuration layer, calculates how many more pods the node can realistically take, and ranks the findings by risk so you know what to fix first.

## Quick Start: Collecting the Capacity Data

The assessment runs in two layers. First, SSH into the node for hardware-level facts:

bash

```
# Baseline hardware info
ssh <node> "lscpu; free -h; df -h; lsblk"

# System limits (inotify, file descriptors, etc.)
ssh <node> "sysctl fs.inotify.max_user_instances fs.file-max"

# What k3s.service is actually running with right now
ssh <node> "systemctl cat k3s.service"
```

Second, pull the kubelet’s live, effective configuration through kubectl — this is more accurate than reading a config file, since it reflects what’s actually **in effect**, not what’s written down but possibly never applied:

bash

```
# The kubelet's real runtime config, not just the file on disk
kubectl get --raw /api/v1/nodes/<node-name>/proxy/configz

# Live resource usage snapshot
kubectl top node
kubectl describe node <node-name>

# Requests/limits across every pod in the cluster
kubectl get pods -A -o json
```

Feed these numbers back into the calculation and you get the node’s actual pod ceiling — and a clear picture of where you’re already overcommitted.

## The Pitfalls: From a Report to a Hardening Pass

**Step one was reading what the report actually said.** The logic behind the ceiling calculation is to compute several independent limits — kubelet’s `max-pods` (defaults to 110 if unset), available IPs on the PodCIDR (a /24 gives you 253), remaining CPU/memory request headroom, free root disk space, and the often-overlooked inotify instance limit. Take the **minimum** across all of these, then knock off another 20% for a "recommended planning ceiling" — because the real ceiling is never set by one number, it's set by whichever plank is shortest.

Risks were bucketed into four tiers, and a couple of the Critical items stopped me cold:

```
+----------+---------------------------------------------------------------+
| Level    | Meaning                                                        |
+----------+---------------------------------------------------------------+
| Critical | DiskPressure closing in, OOM Killer could kill control-plane  |
|          | itself, kubelet has no evictionHard memory threshold set      |
+----------+---------------------------------------------------------------+
| Serious  | CPU requests oversold causing Insufficient cpu, even though   |
|          | actual utilization is low                                     |
+----------+---------------------------------------------------------------+
| Warning  | inotify limits, too many BestEffort QoS pods, no HA           |
+----------+---------------------------------------------------------------+
| Info     | Informational, no immediate action needed                     |
+----------+---------------------------------------------------------------+
```

![](https://miro.medium.com/v2/resize:fit:1400/1*o5ikoNKk23FgguAIHkhmeQ.png)

*Four tiers, ceiling computed as the minimum across every dimension, then discounted by 20%*

That Critical line hit hardest — **the kubelet had zero system-reserved / kube-reserved configuration, and evictionHard only covered nodefs / imagefs, with no memory.available threshold at all**. In plain terms: when memory gets tight, the kubelet won’t calmly evict pods to free space in an orderly way — it hands the job over to the Linux kernel’s OOM Killer, which has no idea “this process is the k3s server itself, kill it and everything dies.” The math at the time showed **limits already oversold to 113%** — this could go off at any moment.

**The first snag once I decided to fix it: the config path didn’t exist.** I assumed k3s managed kubelet args through a drop-in directory. It didn’t:

bash

```
ls /var/lib/rancher/k3s/agent/etc/config.yaml.d/*.yaml
# Exit code 127 --- (eval):1: no matches found: /var/lib/rancher/k3s/agent/etc/config.yaml.d/*.yaml
```

The directory was completely empty — this node had never been managed that way. Going up a level to the real `config.yaml`, I found it already had **OIDC settings** baked in. That meant I couldn't just replace the whole file for convenience; I had to **append** via `kubelet-arg`, being careful not to lose anything already in there.

**Then a smaller operational snag.** This machine’s SSH had no interactive sudo, so any command just hung at the password prompt. The fix was piping the password in through a two-step, non-interactive approach — backing up the original config first so I could roll back instantly if anything went sideways.

The parameters that actually landed:

bash

```
# system-reserved / kube-reserved: hold back resources for the system and kubelet itself
--system-reserved=cpu=500m,memory=1Gi

# eviction-hard: add the missing memory.available threshold
--eviction-hard=memory.available<500Mi,nodefs.available<10%,imagefs.available<15%
```

![](https://miro.medium.com/v2/resize:fit:1400/1*r8VkqTbWnOKfipGshwMHVg.png)

**Without memory.available, the OOM Killer fires blind. With it set, the kubelet politely evicts the lowest-priority pod first.**

Applying this required `systemctl restart k3s` — a real risk, since it causes a brief control-plane interruption (roughly 10-30 seconds). Pods don't get killed, but `kubectl` becomes unreachable during that window. I confirmed every service could tolerate that short blip before restarting, then immediately compared pod counts and status afterward to confirm zero impact.

**With hardening done, a second problem surfaced: capacity governance itself was oversold.** CPU requests had hit 7600m out of 8000m — 95% — while `kubectl top node` showed actual usage at only 1331m, or 16%. This is the classic case of the scheduler caring about requests, not actual usage. Almost any new pod with a CPU request would fail to schedule with `Insufficient cpu`, even though the machine had plenty of headroom in reality.

Digging further, 51 pods had no requests set at all, and 54 had no limits — meaning the scheduler had nothing to work with for a huge chunk of the fleet. I also noticed `fs.inotify.max_user_instances` was still sitting at the default of 512, and wasn't even persisted:

bash

```
cat /etc/sysctl.d/99-k8s.conf
# cat: /etc/sysctl.d/99-k8s.conf: No such file or directory
```

Meaning: reboot this machine and inotify settings snap right back to default. This kind of gap is the most dangerous kind — it never shows up on a normal day, only on the day you least want it to. I persisted the setting and bumped `max-pods` up to 220, leaving more scheduling room for what was coming next.

## Under the Hood

```
+------------------------+-----------------------------------+-------------------------------+
| Item                   | What was done                      | Effect                         |
+------------------------+-------------------------------------+-------------------------------+
| Capacity report         | Two-layer collection (SSH+kubectl) | Turned "feels fine" into a     |
|                         | to compute the ceiling             | ranked, quantified risk list   |
+------------------------+-------------------------------------+-------------------------------+
| Kubelet hardening       | Added system-reserved + eviction-  | OOM Killer can no longer kill  |
|                         | hard (incl. memory.available)      | the k3s server process itself  |
+------------------------+-------------------------------------+-------------------------------+
| CPU requests governance | Audited pods missing requests/     | Scheduler decisions now have   |
|                         | limits                             | real data, not phantom oversell|
+------------------------+-------------------------------------+-------------------------------+
| inotify persistence     | Added /etc/sysctl.d config file    | Setting survives reboots       |
+------------------------+-------------------------------------+-------------------------------+
| max-pods adjustment     | 110 → 220                          | Headroom for later scaling     |
+------------------------+-------------------------------------+-------------------------------+
```

## What Actually Worked

Running a **read-only assessment first** was, in hindsight, the single most valuable move in this whole process — it turned “I think this is probably fine” into “here are the numbers, here’s the ranking.” Decisions stopped being guesswork. The other habit worth keeping: **always append, never overwrite**. That config.yaml with the hidden OIDC settings — if I’d swapped the whole file out for convenience, the fallout wouldn’t have shown up immediately, but it absolutely would have, at the worst possible moment.

## Where This Still Falls Short

One line in the report I deliberately left alone for now: **no HA**, filed under Warning. However hardened this machine gets, it’s still fundamentally a **single point of failure** — if it goes down, the whole cluster goes with it. That’s exactly why the report grouped “no HA” with things like the inotify limit: fine today doesn’t mean fine once you scale. That Warning gets properly addressed in the next post in this series.

How do you gauge how much longer your k3s / k8s environment can hold up — do you wait for alerts to fire, or run an assessment like this ahead of time? Curious to hear how others approach it.

This is Part 1 of the series “Running Production Solo: My k3s High-Availability Journey” Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 2 — From 1 Node to 3: The Full Story of Building Out Longhorn](https://jason-chen-0604.medium.com/from-1-node-to-3-the-full-story-of-building-out-longhorn-3b26f3f45e60)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
