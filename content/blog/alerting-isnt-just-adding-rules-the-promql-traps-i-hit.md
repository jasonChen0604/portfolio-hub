---
title: "Alerting Isn't Just Adding Rules: The PromQL Traps I Hit"
slug: "alerting-isnt-just-adding-rules-the-promql-traps-i-hit"
author: "Jason Chen"
series: { name: "k3s", part: 9 }
publishedAt: "2026-08-17"
excerpt: "k3s Series 9 — A PromQL query reads like a sentence. It doesn’t behave like one. Every rule here looked right on the first read. Most of them weren’t. This is..."
tags: ["Kubernetes", "K3s", "Prometheus", "Promql", "Grafana"]
sourceUrl: "https://jason-chen-0604.medium.com/alerting-isnt-just-adding-rules-the-promql-traps-i-hit-2c152f800a4f"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*iKPp0KIKnPMaSEiTe6FT4Q.png"
---

*k3s Series #9 — A PromQL query reads like a sentence. It doesn’t behave like one.*

![](https://miro.medium.com/v2/resize:fit:1400/1*iKPp0KIKnPMaSEiTe6FT4Q.png)

*Every rule here looked right on the first read. Most of them weren’t.*

> This is Part 9 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 8 — Prometheus + External Grafana: Wiring Up Monitoring for Production](https://jason-chen-0604.medium.com/prometheus-external-grafana-wiring-up-monitoring-for-production-0f821ef6a9f2) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 10 — One IP to Rule the Control Plane: Adding a VIP to k3s HA](https://jason-chen-0604.medium.com/one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha-9125d39aca9b)

## TL;DR

Getting Prometheus and Grafana wired up in the last post was the easy part. Turning that into alerting that actually wakes me up for real problems — and stays quiet otherwise — took several rounds of alert rules that looked correct, fired anyway, and taught me something about how PromQL’s absence-of-data and label semantics don’t work the way plain-English “if this happens, alert me” logic would suggest.

## The Query That Reads Like English and Isn’t One

PromQL has a deceptive property: a well-written query reads almost like a sentence, which makes it easy to trust your first draft more than you should. `count(volume_state == "degraded") > 0` looks like it obviously means "alert me if any volume is degraded." It does mean that — right up until zero volumes match the filter, at which point the query doesn't return zero, it returns **nothing at all**, and Grafana interprets an empty result completely differently than a `0`. The gap between what a query says and what it does under edge conditions is where every trap in this post lives.

## The Fix, in One Sentence

Treat every alert rule as needing to survive three specific edge cases — empty results, label-encoded state instead of numeric values, and duplicate or missing data sources — because naive PromQL translations of “if X, alert” break silently on all three.

## Quick Start: The Defensive Pattern

The single most useful habit, shown once here and referenced throughout the rest of this post:

```
# Naive version — breaks when the count is legitimately zero
count(longhorn_volume_robustness{state="degraded"} == 1) > 0

# Defensive version - an empty result becomes an explicit 0,
# instead of Grafana treating "no data" as a separate failure state
(count(longhorn_volume_robustness{state="degraded"} == 1) OR vector(0)) > 0
```

That `or vector(0)` suffix shows up in nearly every alert rule below, for the same underlying reason each time.

## The Pitfalls: Six Ways a Correct-Looking Rule Still Lies to You

**Pitfall 1 — an empty result isn’t a zero, and Grafana treats it as its own kind of failure.** The first alert rule I wrote used exactly the naive pattern above, without `or vector(0)`. It worked fine right up until every volume was healthy — at which point `count(...)` had nothing to count, returned no data at all, and Grafana's alerting fired a `DatasourceNoData` alert instead of quietly reporting zero. From the outside, this looks like a real incident: an alert fired. It's actually the alerting system misreporting the *absence* of a problem as a *different* problem. The fix is the pattern above — appending `or vector(0)` to any `count(...)`-based rule so an empty match set becomes an explicit, alertable zero instead of an ambiguous nothing.

**Pitfall 2 — **`**longhorn_volume_robustness**`** isn't a numeric-encoded status field, and treating it like one silently breaks the query.** My first instinct, coming from systems where status often gets encoded as an integer (0 = healthy, 1 = degraded, 2 = faulted), was to write something like `longhorn_volume_robustness == 2`. That's wrong, and wrong in a way that doesn't throw an error — it just quietly matches nothing, or the wrong thing. The actual shape of this metric is **one time series per volume, per possible state**, each carrying a binary 0-or-1 value for whether that specific volume is currently in that specific state:

```
longhorn_volume_robustness{volume="pvc-abc", state="healthy"} 1
longhorn_volume_robustness{volume="pvc-abc", state="degraded"} 0
longhorn_volume_robustness{volume="pvc-abc", state="faulted"} 0
```

The correct query filters on the `state` label and checks for the value `1`, not a numeric-encoded severity: `longhorn_volume_robustness{state="degraded"} == 1`. This is a genuinely easy mistake to make once and never notice, because a query built around the wrong mental model doesn't error — it just silently returns the wrong (often empty) result set, and an alert rule built on it stays permanently, quietly broken.

## Get 陳昶仲’s stories in your inbox

**Pitfall 3 — a metric this whole series has been building toward finally got tested, and it almost failed.** Back when off-site backup was set up, the etcd snapshot script was written to also emit a small metric file for node-exporter’s textfile collector to pick up — mentioned then as a detail that would “come back later.” This is that payoff, and it very nearly didn’t work: node-exporter runs as a non-root user, and the metric file it needed to read had been created with permissions that only the process writing it (running as root) could actually open. The alert built on top of backup freshness metrics was, for a while, silently reading nothing. The fix was a one-line permissions change on the script:

```
chmod 644 /var/lib/node_exporter/textfile_collector/etcd_backup.prom
```

Small detail, easy to skip, and it would have meant a completely silent backup-monitoring blind spot if it hadn’t been caught.

**Pitfall 4 — the same series appearing twice made every per-node graph look wrong.** Several dashboard panels were showing what looked like duplicate lines for the same node — same shape, slightly offset, cluttering every per-node graph. The actual cause was a duplicate Prometheus data source pointed at the same target, both scraping and both feeding the same panel. The short-term fix, useful for surviving until the real cleanup happens, is deduplicating in the query itself:

```
max by (instance) (node_cpu_seconds_total)
```

The actual fix is removing the duplicate data source, but `max by (instance)` is a reasonable stopgap that keeps dashboards readable in the meantime without needing to chase down every panel that's affected.

**Pitfall 5 — a backup-freshness alert needs to explicitly exclude volumes that were never backed up at all.** This one was subtle in a way the others weren’t: `longhorn_volume_last_backup_at` reports a Unix timestamp of the last successful backup, and the naive alert — "fire if that timestamp is older than some threshold" — technically works, except for detached volumes that have *never* been backed up. Those report a timestamp of `0`, which is older than any real threshold by definition, meaning the alert would fire **permanently** for volumes that were never supposed to be backed up in the first place, drowning out the alerts that actually matter. The fix requires explicitly filtering those out:

```
(time() - longhorn_volume_last_backup_at) > 86400
  and (longhorn_volume_last_backup_at > 0)
```

**One more habit worth carrying forward, not a bug so much as a trap waiting to happen:** don’t reach for an old, frequently-bookmarked dashboard version out of habit. Metric names in this ecosystem get renamed often enough that pulling in a stale dashboard version can leave panels quietly full of `N/A` with no obvious error pointing at "you're using an outdated dashboard" as the actual cause.

![](https://miro.medium.com/v2/resize:fit:1400/1*E5gBr4BEGXNsIXvik09ORw.png)

*None of these throw an error. That’s exactly what makes them dangerous.*

Under the Hood

```
+---------------------------+----------------------------------------+-------------------------------+
| Trap                      | What actually happens                    | The fix                        |
+---------------------------+----------------------------------------+-------------------------------+
| count() on empty match set | Grafana reports DatasourceNoData,        | Append `or vector(0)`          |
|                            | not a clean zero                         |                                |
+---------------------------+----------------------------------------+-------------------------------+
| robustness as numeric      | Metric is label-per-state, binary        | Filter on the state label,     |
| status                     | value — not an encoded severity          | check == 1                     |
+---------------------------+----------------------------------------+-------------------------------+
| textfile metric unreadable | node-exporter runs non-root, can't       | chmod 644 on the metric file   |
|                            | read a root-only file                    |                                |
+---------------------------+----------------------------------------+-------------------------------+
| Duplicate per-node lines   | Two data sources scraping the same       | max by (instance) as stopgap,  |
|                            | target                                    | remove the duplicate source    |
+---------------------------+----------------------------------------+-------------------------------+
| Backup-age alert firing    | Never-backed-up volumes report           | and (last_backup_at > 0)       |
| permanently                | timestamp 0, always "too old"            |                                |
+---------------------------+----------------------------------------+-------------------------------+
```

## What Actually Worked

The pattern that ended up saving the most repeated debugging was treating `or vector(0)` as a **default habit for any **`**count()**`**-based rule**, not a fix applied reactively after the first false alarm. The other thing worth keeping: reading a metric's actual label structure with `curl`-ing the raw endpoint or checking Grafana's metric explorer *before* writing a query against it, rather than assuming its shape based on what a similarly-named metric looks like elsewhere.

## Where This Still Falls Short

The alerting layer is genuinely solid now — quiet when things are fine, loud when they aren’t, and I’ve stopped getting paged for phantom `NoData` incidents. What it hasn't been tested against yet is a real, simultaneous multi-signal failure — the kind of event where several of these alerts would need to fire together and I'd need to tell, quickly, which one is the actual root cause versus which ones are downstream noise. That's a different kind of problem than getting any single rule correct.

Have you had a monitoring alert that was technically correct but still misled you — firing on something that wasn’t actually a problem, or the reverse? What changed how you write alert rules after that?

> This is Part 9 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 8 — Prometheus + External Grafana: Wiring Up Monitoring for Production](https://jason-chen-0604.medium.com/prometheus-external-grafana-wiring-up-monitoring-for-production-0f821ef6a9f2) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 10 — One IP to Rule the Control Plane: Adding a VIP to k3s HA](https://jason-chen-0604.medium.com/one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha-9125d39aca9b)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
