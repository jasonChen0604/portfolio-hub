---
title: "Running Production Solo: My k3s High-Availability Journey — Series Overview"
slug: "running-production-solo-my-k3s-high-availability-journey-series-overview"
author: "Jason Chen"
publishedAt: "2026-08-05"
excerpt: "Everything I broke, diagnosed, and eventually fixed while self-hosting a k3s production cluster — alone. The full, chronological record of that build."
tags: ["Kubernetes", "K3s", "Self Hosting", "DevOps", "Site Reliability"]
sourceUrl: "https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*bEjitWGES2_llzaYGCA5KA.png"
---

*Everything I broke, diagnosed, and eventually fixed while self-hosting a k3s production cluster — alone.*

![](https://miro.medium.com/v2/resize:fit:1400/1*bEjitWGES2_llzaYGCA5KA.png)

I self-host a k3s production environment on 3 bare Ubuntu 24.04 machines — 180+ pods, a dozen-plus namespaces, stateful services like Postgres/Mongo/Redis, Longhorn for storage, Synology NAS for off-site backup, and an external Grafana for monitoring. There's no team behind this. Just me, and whatever mistakes I was willing to make and then write down.

This series is the full, chronological record of that build: what looked fine and wasn't, what I broke on purpose to learn how it failed, and what I had to fix twice because the first fix was wrong. Every post follows the same shape — the problem, the exact commands and error messages, and what I'd tell someone about to hit the same wall.

Below is every part of the series, in the order things actually happened.

## Part 1 — [The Moment a Single Node Couldn't Keep Up: It Started With a Capacity Report](https://jason-chen-0604.medium.com/the-moment-a-single-node-couldnt-keep-up-it-started-with-a-capacity-report-5367c7ea1edc)

A single-node cluster that felt fine — until a capacity report flagged Critical-level OOM risk. Quantifying the danger, then hardening the kubelet.

## Part 2 — [From 1 Node to 3: The Full Story of Building Out Longhorn](https://jason-chen-0604.medium.com/from-1-node-to-3-the-full-story-of-building-out-longhorn-3b26f3f45e60)

Every Longhorn volume was "degraded" because there was only one node to put replicas on. Scaling to 3 nodes, and the three traps along the way.

## Part 3 — [Longhorn PVC Operations: Shrinking and Growing Storage Without Losing Data](https://jason-chen-0604.medium.com/longhorn-pvc-operations-shrinking-and-growing-storage-without-losing-data-f1ce11ef737d)

Kubernetes won't let you shrink a PVC. Two unrelated incidents, one shared fix: --cascade=orphan.

## Part 4 — [RWO→RWX: Down the Rabbit Hole to a Corrupted Instance-Manager](https://jason-chen-0604.medium.com/rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager-4b8bf293b443)

A textbook Multi-Attach error, until the known fix stopped working. Five layers down: a corrupted instance-manager, debugged from inside a distroless container.

## Part 5 — [From SQLite to a 3-Server etcd Cluster: The Full HA Upgrade](https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae)

Three nodes were already running — only one was actually in charge. The irreversible migration from single-server SQLite to full 3-server etcd HA.

## Part 6 — [Off-Site Backup: etcd Snapshots and Longhorn's Double Insurance](https://jason-chen-0604.medium.com/off-site-backup-etcd-snapshots-and-longhorns-double-insurance-026636f46254)

HA survives losing one node. This closes the gap HA can't: two independent backup legs for etcd and Longhorn, shipped off-site.

## Part 7 — [Assume All 3 Machines Die: A Full Disaster Recovery Drill](https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93)

A backup you've never restored from is a hypothesis, not a guarantee. The documented — but honestly not yet fire-drilled — full recovery procedure.

## Part 8 — [Prometheus + External Grafana: Wiring Up Monitoring for Production](https://jason-chen-0604.medium.com/prometheus-external-grafana-wiring-up-monitoring-for-production-0f821ef6a9f2)

HA and backups don't matter if you're the last to know something's wrong. Wiring Prometheus into k3s and pointing it at an existing external Grafana.

## Part 9 — [Alerting Isn't Just Adding Rules: The PromQL Traps I Hit](https://jason-chen-0604.medium.com/alerting-isnt-just-adding-rules-the-promql-traps-i-hit-2c152f800a4f)

A PromQL query reads like a sentence but doesn't behave like one. Six alert rules that looked correct and fired anyway — or worse, stayed silent.

## Part 10 — [One IP to Rule the Control Plane: Adding a VIP to k3s HA](https://jason-chen-0604.medium.com/one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha-9125d39aca9b)

The cluster survived losing a node. My kubectl config didn't — it still pointed at one. Adding a VIP with kube-vip closed that gap.

## Part 11 — [Multiple Nodes Isn't the Same as Highly Available: A Full HA Audit](https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7)

3 nodes and "highly available" aren't the same claim. Running the actual N-1 math, checking replica placement, and auditing hidden single points.

## Part 12 — [Your k3s HA Might Be Fake: How a Traditional HDD Quietly Undermines etcd](https://jason-chen-0604.medium.com/your-k3s-ha-might-be-fake-how-a-traditional-hdd-quietly-undermines-etcd-7ad25d4771b9)

3 servers, VIP, audited N-1 capacity — none of it checks disk latency. A read-only test found etcd's fsync averaging 14ms against a 10ms ceiling.

## Part 13 — [When You Can't Replace the HDD: Buying etcd More Time](https://jason-chen-0604.medium.com/when-you-cant-replace-the-hdd-buying-etcd-more-time-bd5d3d852629)

etcd and Longhorn weren't fighting over the same disk — they weren't even on the same drive. What actually helps when you can't replace an HDD yet.

## Part 14 — [Containerd Filled the System Disk: A Two-Phase, Minimal-Downtime Migration](https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3)

Same batch of 3 nodes, one small decision at join time: 13% vs 65% vs 80% disk usage, years later. A two-phase, minimal-downtime fix.

## Part 15 — [The Discipline Behind All of This](https://jason-chen-0604.medium.com/the-discipline-behind-all-of-this-725a831c327f)

Fourteen posts of incidents. Looking back, one habit — trust the number, not the vibe — shows up in almost every single one of them. The series closer.

More parts will be added to this list as they're published — check back, or follow along for updates.

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)
- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app)
- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
