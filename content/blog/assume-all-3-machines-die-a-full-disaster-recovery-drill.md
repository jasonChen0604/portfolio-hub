---
title: "Assume All 3 Machines Die: A Full Disaster Recovery Drill"
slug: "assume-all-3-machines-die-a-full-disaster-recovery-drill"
author: "Jason Chen"
series: { name: "k3s", part: 7 }
publishedAt: "2026-08-15"
excerpt: "k3s Series 7 — A backup you’ve never restored from isn’t a backup. It’s a hypothesis. Three empty machines, two backup files, and a procedure I need to..."
tags: ["Kubernetes", "K3s", "Disaster Recovery", "Etcd", "Longhorn"]
sourceUrl: "https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*Q5P_Hjm9aYviK4u--bNdAg.png"
---

*k3s Series #7 — A backup you’ve never restored from isn’t a backup. It’s a hypothesis.*

![](https://miro.medium.com/v2/resize:fit:1400/1*Q5P_Hjm9aYviK4u--bNdAg.png)

*Three empty machines, two backup files, and a procedure I need to actually run someday*

> This is Part 7 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 6 — Off-Site Backup: etcd Snapshots and Longhorn’s Double Insurance](https://jason-chen-0604.medium.com/off-site-backup-etcd-snapshots-and-longhorns-double-insurance-026636f46254) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 8 — Prometheus + External Grafana: Wiring Up Monitoring for Production](https://jason-chen-0604.medium.com/prometheus-external-grafana-wiring-up-monitoring-for-production-0f821ef6a9f2)

## TL;DR — and a note on what this post actually is

Most posts in this series are war stories: something broke, here’s exactly how, here’s the fix. This one is different, and I want to be upfront about that instead of dressing it up as something it isn’t. **I have not yet pulled the plug on all three nodes and rebuilt this cluster from scratch under real pressure.** What I have is the documented recovery procedure — reconstructed from the k3s and Longhorn restore mechanics, tied together into the order that actually needs to happen — and an honest admission that a procedure I haven’t fire-drilled is still, at best, a well-informed guess about how the real thing would go. This post is that procedure, and a commitment to actually go run it.

## The Gap Between “Having a Backup” and “Having Tested a Restore”

The previous post in this series set up two independent backup legs — etcd snapshots and Longhorn volume backups, both shipped off-site. It’s easy to treat that as the finish line. It isn’t. **A backup file sitting on a NAS is a claim, not a fact**, until something has actually been rebuilt from it. The most dangerous assumption in any backup strategy isn’t “I don’t have backups” — that’s at least honest. It’s “I have backups, so I’m covered,” said by someone who has never actually tried to use them under pressure. This post exists to push back against my own version of that assumption, by writing down exactly what the recovery path is supposed to look like, in enough detail that I can’t quietly skip steps when I do eventually run it for real.

## The Fix, in One Sentence

Rebuild the cluster identity from the etcd snapshot first, then restore Longhorn’s volumes into that freshly re-established cluster, then bring HA back — in that order, because each step depends on the one before it existing.

## Quick Start: The Recovery Sequence

**Step 1 — re-establish the cluster from the etcd snapshot.** This has to happen before anything else, because nothing in Longhorn means anything without a cluster to attach it to:

```
# On a fresh node, restore the cluster's identity from the most recent etcd snapshot
k3s server \
  --cluster-reset \
  --cluster-reset-restore-path=/path/to/etcd-snapshot \
  --cluster-init
```

**Step 2 — restore Longhorn’s volumes into the newly re-established cluster.** With the control plane back and Longhorn’s CRDs restored along with it, the actual data comes back from the off-site NAS backup target:

```
# Point Longhorn at the same off-site backup target used in the previous post
kubectl apply -f - <<EOF
apiVersion: longhorn.io/v1beta2
kind: BackupTarget
metadata:
  name: default
  namespace: longhorn-system
spec:
  backupTargetURL: nfs://<nas-ip>:/volume1/longhorn-backup
EOF

# Then, per volume, restore from the corresponding backup
kubectl apply -f - <<EOF
apiVersion: longhorn.io/v1beta2
kind: Volume
metadata:
  name: <volume-name>
  namespace: longhorn-system
spec:
  fromBackup: <backup-url>
EOF
```

**Step 3 — bring the other two nodes back into an HA control plane.** With one node up and holding both the cluster definition and the restored data, the remaining two machines rejoin as etcd servers, following the same one-at-a-time join sequence covered earlier in this series.

## Why the Order Actually Matters

It’s tempting to think of these three steps as independent tasks that could happen in any sequence, or even in parallel to save time. They can’t, and the reason is worth spelling out rather than just asserting. **Longhorn’s volumes are meaningless without a cluster that has Longhorn’s own CRDs and controller running** — trying to restore volume data before the cluster itself exists has nothing to attach to. **The cluster’s control plane is meaningless without etcd holding the definitions of what’s supposed to be running** — a k3s server with no restored etcd snapshot is just an empty scheduler with nothing to schedule. And **HA is meaningless on a cluster that doesn’t have correct data yet** — there’s no point synchronizing three nodes around a control plane that’s still missing the volumes it’s supposed to be managing. Each step is a prerequisite for the next one being able to mean anything at all.

![](https://miro.medium.com/v2/resize:fit:1400/1*nCW7eNjQX3RKujzop1AK7g.png)

*Not three independent tasks: a strict dependency chain*

Under the Hood

```
+------------------------+--------------------------------------+---------------------------------+
| Step                    | What it restores                       | Why it has to come first       |
+------------------------+--------------------------------------+---------------------------------+
| 1. etcd snapshot restore | Cluster identity, all specs, all       | Nothing else has anywhere to    |
|                          | scheduling state                       | attach without this existing    |
+------------------------+--------------------------------------+---------------------------------+
| 2. Longhorn volume       | Actual application data (Postgres,     | Needs the cluster's CRDs and    |
|    restore               | Mongo, Redis, files)                   | controllers from step 1 running |
+------------------------+--------------------------------------+---------------------------------+
| 3. Rejoin remaining      | Fault tolerance for the control plane  | Pointless to synchronize nodes  |
|    nodes as etcd servers | itself                                 | around data that isn't restored |
|                          |                                         | yet                             |
+------------------------+--------------------------------------+---------------------------------+
```

## What I’m Honestly Not Sure About Yet

This is the section I could have skipped to make this post read more confidently, and I’m choosing not to. There are real unknowns here that only a live drill would surface: how stale the most recent off-site snapshot actually is relative to the moment of failure, whether the Longhorn backup target reconnects cleanly to a *brand-new* cluster with no prior history versus the recovery scenarios Longhorn’s docs mostly describe, and how long this entire sequence actually takes under real conditions rather than as a list of commands on a page. I’d rather tell you that honestly than write a dramatic “and then disaster struck” narrative for an event that, as of this post, hasn’t actually happened.

## Where This Still Falls Short

The procedure exists and is internally consistent, but “internally consistent on paper” and “survives contact with an actual disaster” are different claims, and I’m not going to pretend otherwise. The next real step isn’t another blog post — it’s actually scheduling time to take all three nodes down, on purpose, and rebuild from nothing but what’s sitting on that NAS. When I do, I’ll write about what the procedure above got right and where it was wrong.

## Get 陳昶仲’s stories in your inbox

Have you actually run a full disaster recovery drill on your own infrastructure — not just written the runbook, but pulled the plug and rebuilt? What did the runbook get wrong when reality showed up?

> This is Part 7 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 6 — Off-Site Backup: etcd Snapshots and Longhorn’s Double Insurance](https://jason-chen-0604.medium.com/off-site-backup-etcd-snapshots-and-longhorns-double-insurance-026636f46254) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 8 — Prometheus + External Grafana: Wiring Up Monitoring for Production](https://jason-chen-0604.medium.com/prometheus-external-grafana-wiring-up-monitoring-for-production-0f821ef6a9f2)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
