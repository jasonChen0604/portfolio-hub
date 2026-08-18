---
title: "Your k3s HA Might Be Fake: How a Traditional HDD Quietly Undermines etcd"
slug: "your-k3s-ha-might-be-fake-how-a-traditional-hdd-quietly-undermines-etcd"
author: "Jason Chen"
series: { name: "k3s", part: 12 }
publishedAt: "2026-08-18"
excerpt: "k3s Series 12–3 servers, verified quorum, a VIP, audited N-1 capacity. None of it matters if the disk underneath etcd can’t keep up. Every fix in this series..."
tags: ["Kubernetes", "K3s", "Etcd", "High Availability", "Performance"]
sourceUrl: "https://jason-chen-0604.medium.com/your-k3s-ha-might-be-fake-how-a-traditional-hdd-quietly-undermines-etcd-7ad25d4771b9"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*LrLo9pVNqwx3RUiJjXe9mw.png"
---

*k3s Series #12–3 servers, verified quorum, a VIP, audited N-1 capacity. None of it matters if the disk underneath etcd can’t keep up.*

![](https://miro.medium.com/v2/resize:fit:1400/1*LrLo9pVNqwx3RUiJjXe9mw.png)

*Every fix in this series so far assumed the disk was fine. It wasn’t, and nothing had checked.*

> This is Part 12 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 11 — Multiple Nodes Isn’t the Same as Highly Available: A Full HA Audit](https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 13 — When You Can’t Replace the HDD: Buying etcd More Time](https://jason-chen-0604.medium.com/when-you-cant-replace-the-hdd-buying-etcd-more-time-bd5d3d852629)

## TL;DR

Every layer of HA built up over this series — 3-server etcd, a VIP, an audited N-1 capacity margin — sits on top of one assumption nobody had actually tested: that the disks underneath etcd are fast enough for etcd to trust. They weren’t. A read-only check of etcd’s own metrics found worker nodes averaging **14ms fsync latency against etcd’s 10ms official threshold**, an estimated p99 landing **6 to 25 times over that threshold**, and over a thousand “apply request took too long” warnings inside a single hour. Quorum was still holding — but on borrowed time, and nothing about the topology, the VIP, or the capacity audit would have caught this, because none of them look at disk latency at all.

## The Layer Nobody Had Checked

Every post in this series so far assumed something reasonable but untested: that the hardware underneath all this HA engineering could actually keep up with what HA demands of it. **etcd has a specific, unforgiving requirement that has nothing to do with node count, quorum size, or capacity headroom**: every write has to be fsync’d to disk before etcd can even acknowledge it, and etcd’s own documentation is explicit that this fsync needs to complete in roughly 10ms at p99 or the whole consensus mechanism starts to strain. SSDs comfortably clear that bar, often under 1ms. Traditional HDDs — spinning disks, or virtual disks backed by them — routinely land in the 10–30ms range. None of the work in this series so far would have surfaced that gap, because none of it looks at disk latency. It took a dedicated check to find it.

## The Fix, in One Sentence

Pull etcd’s own exposed fsync latency metrics with a single `curl`, cross-check against k3s's own "apply took too long" log warnings, and treat the combination as a read-only, zero-risk way to know whether the disk underneath etcd is actually keeping up — no synthetic load testing required.

## Quick Start: Reading etcd’s Own Numbers

k3s doesn’t wire etcd’s metrics into Prometheus by default, but etcd itself exposes them locally regardless:

```
# etcd's own metrics endpoint, local to each server node
curl -s http://127.0.0.1:2381/metrics | grep etcd_disk_wal_fsync_duration_seconds

# Average fsync latency = sum / count
# etcd_disk_wal_fsync_duration_seconds_sum{...}
# etcd_disk_wal_fsync_duration_seconds_count{...}
# p99 can be estimated from the histogram buckets in the same output
```

Cross-verification, independent of the metrics endpoint entirely:

```
# k3s's own log line for exactly this problem
journalctl -u k3s | grep "apply request took too long"
```

If both sources agree, you’ve confirmed the same thing two independent ways without touching a single running workload — this whole check is read-only from start to finish.

## What the Numbers Actually Said

Running this against the cluster’s three real nodes, under real production load rather than synthetic benchmarking, produced numbers precise enough to be genuinely alarming:

- One node averaged **4.16ms** fsync latency — comfortably inside etcd’s comfort zone.

- The other two — both worker-turned-servers on the same class of virtual HDD — averaged **14.2ms and 13.9ms**. The *average* was already past the 10ms threshold, which is a very different statement than “occasionally spikes past it.”

- Estimated p99 landed somewhere in the **64–256ms** range — roughly **6 to 25 times** etcd’s official ceiling.

- Cross-checking against the k3s logs: **512, 1540, and 1223** separate “apply request took too long” warnings across the three servers within a single hour of observation, with individual apply latencies measured between **100 and 600ms**.

**The conclusion this points to isn’t “the cluster is broken.”** Quorum was holding. Nothing had failed. The conclusion is narrower and, in some ways, more unsettling: this cluster was tolerating disk latency well past what etcd is designed to handle gracefully, and the only reason nothing had visibly broken yet is that raft’s leader election hadn’t happened to trigger during one of these slow windows. **IO pressure spiking — a Longhorn rebuild, a backup window, a traffic surge — is exactly the kind of event that could push this from “quietly degraded” into “a real, user-facing quorum flap.”** This is the failure mode that “3 nodes, all healthy” completely hides: multi-node HA that looks solid on paper and detonates specifically under load, precisely when you’d least want it to.

![](https://miro.medium.com/v2/resize:fit:1400/1*-q9hdYfTMnMO3tv1L2Pkgg.png)

*Not a spike. An average, sitting past the line.*

A Second, Related Blind Spot: Clock Skew

## Get 陳昶仲’s stories in your inbox

While investigating the disk latency issue, a second, unrelated-but-adjacent problem surfaced: **NTP sync had silently stopped working** on these nodes. Corporate networks often block outbound NTP traffic to public servers like `ntp.ubuntu.com` as a matter of course, and `timesyncd` had been quietly reporting `Timed out` without anywhere loud enough to notice. etcd is sensitive to clock drift between nodes in ways that compound the fsync problem rather than existing independently of it — both are forms of the same underlying risk: **etcd's consensus mechanism has assumptions about timing that infrastructure quietly violates without any obvious symptom until it doesn't.** The fix was pointing `timesyncd` at an internal NTP source instead — often the network gateway itself, which most corporate networks already run. One more reminder worth repeating from earlier in this series: checking whether a port is reachable via a `/dev/udp` one-liner is not a real connectivity test; a genuine `ping` or an actual protocol-aware check is the only way to trust the result.

## Under the Hood

```
+---------------------------+----------------------------------------+-------------------------------+
| Check                     | Result                                   | What it means                 |
+---------------------------+----------------------------------------+-------------------------------+
| fsync latency (1 node)     | 4.16ms average                           | Comfortably within threshold  |
+---------------------------+----------------------------------------+-------------------------------+
| fsync latency (2 workers)  | 14.2ms / 13.9ms average                  | Average already past 10ms —   |
|                            |                                          | not just occasional spikes    |
+---------------------------+----------------------------------------+-------------------------------+
| Estimated p99               | 64-256ms                                 | 6-25x etcd's official ceiling |
+---------------------------+----------------------------------------+-------------------------------+
| Slow apply warnings         | 512 / 1540 / 1223 in ~1 hour             | Quorum tolerating this, not   |
| (per server)                |                                          | immune to it                  |
+---------------------------+----------------------------------------+-------------------------------+
| NTP sync                    | Silently failing, blocked outbound       | Clock skew compounds the same |
|                              |                                          | underlying risk               |
+---------------------------+----------------------------------------+-------------------------------+
```

## What Actually Worked

The habit that mattered most here was refusing to let “quorum is holding” count as “the infrastructure underneath is fine” — those are genuinely different claims, and only one of them was actually true. The other thing worth keeping: this entire investigation was **read-only from start to finish**. No synthetic load, no `fio` benchmark hammering production disks, just reading metrics etcd was already exposing and correlating them against logs k3s was already writing. A dangerous-looking finding doesn't require a dangerous method to uncover it.

## Where This Still Falls Short

Finding this problem and fixing it are two different posts, and this one is honestly the former. The real fix — moving etcd’s data directory onto genuinely fast storage — wasn’t something that could happen immediately, which meant the actual next question was different: **what can you do about etcd’s tolerance for slow disks when replacing the disk isn’t an option yet?** That’s a real, separate investigation, not a footnote to this one.

Has “everything looks healthy” ever turned out to be hiding a latency problem that only a dedicated, targeted check would surface? What made you go looking?

> This is Part 12 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 11 — Multiple Nodes Isn’t the Same as Highly Available: A Full HA Audit](https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 13 — When You Can’t Replace the HDD: Buying etcd More Time](https://jason-chen-0604.medium.com/when-you-cant-replace-the-hdd-buying-etcd-more-time-bd5d3d852629)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
