---
title: "The Discipline Behind All of This"
slug: "the-discipline-behind-all-of-this"
series: { name: "k3s", part: 15 }
author: "Jason Chen"
publishedAt: "2026-08-21"
excerpt: "k3s Series #15 — Fourteen posts of incidents. One habit shows up in almost every single one of them."
tags: ["Kubernetes", "K3s", "DevOps", "Site Reliability", "Self Hosting"]
sourceUrl: "https://jason-chen-0604.medium.com/the-discipline-behind-all-of-this-725a831c327f"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*WxTb2oWVJUGsTOFO4Uznqg.png"
---

*k3s Series #15 — Fourteen posts of incidents. One habit shows up in almost every single one of them.*

![](https://miro.medium.com/v2/resize:fit:1400/1*WxTb2oWVJUGsTOFO4Uznqg.png)

This is Part 15 of "Running Production Solo: My k3s High-Availability Journey" — the series closer. Previous: [Part 14 — Containerd Filled the System Disk: A Two-Phase, Minimal-Downtime Migration](https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: none — this is the last part

## TL;DR

Fourteen posts back, this series started with a single-node cluster and a capacity report that said "Critical." It ends here, with a 3-server HA control plane, a VIP, replicated storage, off-site backups, monitoring, alerting, and a hardware limitation I still haven't fully solved. Looking back across all of it, the individual fixes were never really the point. A small number of habits show up again and again, in completely different contexts, and they're the actual through-line of this series — more than etcd, more than Longhorn, more than any single tool.

## Three Habits, Recurring

**Habit 1 — read-only diagnosis before touching anything, and a baseline snapshot to compare against afterward.** This shows up almost everywhere in this series, and it's easy to undersell how much it actually did. The [capacity report in Part 1](https://jason-chen-0604.medium.com/the-moment-a-single-node-couldnt-keep-up-it-started-with-a-capacity-report-5367c7ea1edc) never touched a running workload — it just measured, and that measurement is what turned "this cluster feels fine" into a Critical-rated finding that actually got acted on. The [etcd fsync investigation in Part 12](https://jason-chen-0604.medium.com/your-k3s-ha-might-be-fake-how-a-traditional-hdd-quietly-undermines-etcd-7ad25d4771b9) is the same instinct at its most consequential: a curl against a metrics endpoint and a journalctl grep uncovered a genuinely dangerous finding — quorum tolerating disk latency 6-25x past etcd's own threshold — without a single synthetic write hitting production. And in [Part 13](https://jason-chen-0604.medium.com/when-you-cant-replace-the-hdd-buying-etcd-more-time-bd5d3d852629), a five-minute dd benchmark disproved my own first theory about disk contention before I wasted an afternoon migrating data to a destination that would have been exactly as slow as the source. None of these findings required risking anything to uncover. That's not a coincidence — it's a habit.

**Habit 2 — anything that touches live state gets confirmed before it happens, and stays reversible until it's proven safe.** The [etcd HA migration in Part 5](https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae) was explicit about this from the start: a genuinely irreversible operation, with a filesystem backup taken *before* touching anything, specifically so the decision to proceed wasn't a one-way door until the backup existed to make it not one. The [containerd migration in Part 14](https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3) renamed the old data directory to `.old` instead of deleting it, on the assumption that a rollback path costs nothing to keep and would be genuinely painful not to have. Even something as small as [Part 8's Helm CRD failure](https://jason-chen-0604.medium.com/prometheus-external-grafana-wiring-up-monitoring-for-production-0f821ef6a9f2) fits this pattern in miniature — reading the actual error instead of assuming the obvious, more destructive interpretation ("start over from scratch") was correct.

**Habit 3 — a backup you haven't tried to restore from is a claim, not a fact.** This is the one I have the least comfortable answer for, and I said so directly in [Part 7](https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93): the recovery procedure exists, is internally consistent, and has not actually been fire-drilled against a real simultaneous 3-node failure. I'd rather end this series with that honestly unresolved than pretend it's settled. It's the one habit in this list I've stated more than I've actually practiced, and that gap is worth naming instead of quietly leaving out of the retrospective.

## The Pattern Underneath the Pattern

Looking back at all fourteen posts together, there's a shape to how problems actually got found that's worth naming explicitly, because it repeats more than any single technical lesson does: **almost nothing in this series was found by something breaking loudly.** The N-1 capacity math in [Part 11](https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7) wasn't triggered by an incident — it was triggered by refusing to accept "3 nodes" as proof of anything until the actual arithmetic backed it up. The Longhorn replica placement check in that same post found 62 volumes that were all fine, technically, and checked anyway. The disk imbalance in [Part 14](https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3) had been quietly accumulating for years before anyone went looking at it deliberately. **The failures worth catching in a system like this are rarely the ones announcing themselves — they're the ones sitting quietly inside something that currently looks fine, waiting for a specific combination of load or timing to surface.** That's a harder thing to build a habit around than "respond well to incidents," and it's the one I'd point to first if I had to pick a single thread connecting all fourteen posts.

## Where the Threads Actually Connect

A few of the more satisfying moments in this series were places where an earlier decision quietly paid off much later, and it's worth naming them together instead of leaving them scattered across separate posts:

- The Warning-level "no HA" finding in [Part 1's capacity report](https://jason-chen-0604.medium.com/the-moment-a-single-node-couldnt-keep-up-it-started-with-a-capacity-report-5367c7ea1edc) is the finding that [Part 5](https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae) actually went and fixed.
- The degraded-volume mystery that opens [Part 2](https://jason-chen-0604.medium.com/from-1-node-to-3-the-full-story-of-building-out-longhorn-3b26f3f45e60) is resolved by the same node-scaling work that post walks through — the story closes its own loop within a single post, which is rarer than it sounds.
- The small node-exporter textfile metric planted almost as an aside in [Part 6](https://jason-chen-0604.medium.com/off-site-backup-etcd-snapshots-and-longhorns-double-insurance-026636f46254) is the exact metric that turns up, permissions bug and all, in [Part 9's alerting work](https://jason-chen-0604.medium.com/alerting-isnt-just-adding-rules-the-promql-traps-i-hit-2c152f800a4f).
- The anti-affinity rules established during [Part 11's HA audit](https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7) are the reason [Part 14's migration downtime](https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3) didn't touch multi-replica services at all.
- The rolling-reboot discipline stated explicitly in [Part 10's VIP post](https://jason-chen-0604.medium.com/one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha-9125d39aca9b) is the exact procedure that turned [Part 14's routine maintenance](https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3) into an accidental, genuine HA drill.

None of these connections were planned when the earlier posts were written. They're what happens when the same handful of habits get applied consistently enough, for long enough, that they start reinforcing each other without anyone deciding they should.

## What This Series Doesn't Claim

This series was never a claim that this cluster is done, or fully hardened, or immune to the next thing that goes wrong. [Part 7](https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93) is still an untested procedure. [Part 13](https://jason-chen-0604.medium.com/when-you-cant-replace-the-hdd-buying-etcd-more-time-bd5d3d852629) is explicit that nothing in it makes the underlying hardware fast — it buys time, not a fix. The Field Notes that started appearing alongside this main series — a kube-vip leader election timeout causing intermittent 502s, a CI/CD template with no concurrency control, an alert rule that couldn't tell "broken" from "intentionally decommissioned" — are proof this environment keeps generating new problems the same way any real production system does, HA or not. That's not a failure of the series. It's the honest state of running something alone, in production, without a team to catch what you miss.

## The One Thing I'd Actually Tell Someone Starting This

If there's a single piece of advice underneath all fourteen posts, it's smaller than it sounds: **trust the number, not the vibe.** "3 nodes" felt like HA. It wasn't, until the N-1 math actually said so. "Healthy" felt like redundancy. It wasn't, until replica placement actually got checked. "Backed up" felt like safe. It still isn't, fully, until a real restore actually happens. Every genuinely useful finding in this series came from refusing to accept a feeling as a fact, and going and checking instead — usually with a command that took thirty seconds to run and cost nothing to be wrong about.

This is where the main series ends, for now — though the cluster keeps running, and Field Notes will keep showing up whenever it produces something worth writing down. If you've followed along from Part 1, or found this series through one specific post that solved a problem you had: what's the equivalent habit in your own infrastructure — the one thing you check before trusting anything else?

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)
- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)
- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
