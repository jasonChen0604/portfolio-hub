---
title: "Off-Site Backup: etcd Snapshots and Longhorn’s Double Insurance"
slug: "off-site-backup-etcd-snapshots-and-longhorns-double-insurance"
author: "Jason Chen"
publishedAt: "2026-08-13"
excerpt: "k3s Series 6 — HA answers “what if one machine dies.” This post is about the question HA can’t answer: what if all three die at once? The cluster’s brain and..."
tags: ["Kubernetes", "K3s", "Longhorn", "Backup", "DevOps"]
sourceUrl: "https://jason-chen-0604.medium.com/off-site-backup-etcd-snapshots-and-longhorns-double-insurance-026636f46254"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*sYWrMl3iCG9YgIczmLsUdQ.png"
---

*k3s Series #6 — HA answers “what if one machine dies.” This post is about the question HA can’t answer: what if all three die at once?*

![](https://miro.medium.com/v2/resize:fit:1400/1*sYWrMl3iCG9YgIczmLsUdQ.png)

**The cluster’s brain and its data are two different things — losing either one needs its own insurance**

This is Part 6 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 5 — From SQLite to a 3-Server etcd Cluster: The Full HA Upgrade](https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 7 — Assume All 3 Machines Die: A Full Disaster Recovery Drill](https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93)

## TL;DR

The last post ended on a gap: 3-server etcd HA means the cluster survives losing *one* machine, but power loss, a bad update, or any event that takes out all three at once would still mean total data loss. Closing that gap needs two genuinely separate backup legs — one for the cluster’s brain (etcd), one for the actual data sitting in Longhorn volumes — both shipped off-site to a NAS. Setting this up looked simple on paper and turned into three separate fights with a Synology NFS export before it actually worked.

## Two Different Things Called “Backup”

It’s tempting to think of “backup” as one checkbox — either you have it or you don’t. But a k3s cluster running Longhorn actually has two entirely separate things that both need protecting, and they don’t overlap at all. **etcd holds the cluster’s brain**: every Deployment spec, every Secret, every scheduling decision, the entire shape of what’s supposed to be running. **Longhorn volumes hold the actual data**: the rows in Postgres, the files a service has written, the state nothing else remembers. Losing etcd without losing data means you have all your data sitting on disks with no cluster left that knows what to do with it. Losing data without losing etcd means you have a perfectly intact cluster definition pointing at empty volumes. Neither backup covers for the other — you need both, and you need both somewhere that isn’t these same three machines.

## The Fix, in One Sentence

Ship etcd snapshots and Longhorn volume backups to an off-site NAS on independent schedules, so that losing all three cluster nodes at once still leaves both the cluster’s definition and its data recoverable elsewhere.

## Quick Start: Two Independent Pipelines

**etcd snapshots** — k3s has this mostly built in; the missing piece is getting the local snapshot off the machine:

```
# k3s's built-in etcd snapshot scheduling — already local, just needs config
# /etc/rancher/k3s/config.yaml on each server:
#   etcd-snapshot-schedule-cron: "0 */6 * * *"
#   etcd-snapshot-retention: 5

# systemd timer that ships the local snapshot to NAS via rsync
cat /etc/systemd/system/etcd-snapshot-to-nas.timer
# [Timer]
# OnCalendar=*-*-* 06,12,18,00:15:00
# Persistent=true
```

**Longhorn volume backups** — pointed at an NFS share on the same NAS:

```
# BackupTarget, set via the Longhorn CRD (not the older UI setting)
kubectl apply -f - <<EOF
apiVersion: longhorn.io/v1beta2
kind: BackupTarget
metadata:
  name: default
  namespace: longhorn-system
spec:
  backupTargetURL: nfs://<nas-ip>:/volume1/longhorn-backup
  pollInterval: 300s
EOF
```

Both pipelines are independent on purpose — one going down shouldn’t take the other with it.

## The Pitfalls: Three Rounds With the Same NFS Share

**Pitfall 1 — Squash set to the wrong mode silently breaks every backup write.** The first Longhorn backup attempts failed with permission errors that didn’t immediately point at the NAS. The root cause turned out to be the NFS export’s Squash setting on Synology — by default it can downgrade the writing user’s privileges, which meant every write coming in as root (which Longhorn’s backup process does) got quietly demoted. The fix is setting Squash to **No mapping** on the export, so root stays root across the NFS boundary instead of getting silently stripped down to something with no write access.

**Pitfall 2 — a backup target reporting broken is often lying.** After fixing the Squash setting, the Longhorn UI kept showing the backup target as `AVAILABLE: false` with a mount error, even on retries. The instinct here is to assume the NFS export itself is actually broken — but running a manual check against the same target told a different story:

```
# manually exercise the backup target, bypassing the UI's cached state
longhorn backup list
```

This came back clean, which meant the target was genuinely reachable — the `AVAILABLE: false` in the UI was a **stale condition** left over from before the Squash fix, not a live failure. The fix wasn't touching the NFS config again; it was just getting Longhorn's own state to catch up:

```
kubectl -n longhorn-system rollout restart daemonset longhorn-manager
```

The lesson worth keeping here: a “broken” status in Longhorn’s UI is a claim about the *last* check, not necessarily the *current* state — worth verifying independently before assuming the underlying infrastructure is actually at fault.

**Pitfall 3 — Synology won’t let you create a top-level shared folder from the File Station UI.** This one isn’t a Longhorn or k3s problem at all, but it stalled the whole setup for a bit. Trying to create the shared folder that Longhorn’s backup target points at, directly through the File Station interface, silently doesn’t work — File Station only manages content *inside* existing shared folders, not the folders themselves. The shared folder itself has to be created through Synology’s **Control Panel**, under Shared Folder settings — a different part of the admin UI entirely from where you’d naturally go looking while setting up NFS exports.

![](https://miro.medium.com/v2/resize:fit:1400/1*Ka-W2mxmgyuQt25wFrz2Ow.png)

**etcd’s brain and Longhorn’s data travel separately — and fail separately too**

Under the Hood

```
+---------------------------+----------------------------------------+-------------------------------+
| Item                      | What was done                            | Why it matters                |
+---------------------------+----------------------------------------+-------------------------------+
| etcd snapshot schedule     | Built-in k3s scheduling, local first     | Cluster brain backed up        |
|                            | then shipped off-site via systemd timer  | independently of data          |
+---------------------------+----------------------------------------+-------------------------------+
| Longhorn BackupTarget      | Set via CRD (v1.11+ way), not the        | Points volume backups at the   |
|                            | older UI-only setting                    | same NAS, separate pipeline    |
+---------------------------+----------------------------------------+-------------------------------+
| NFS Squash = No mapping    | Fixed on the Synology export             | Root writes no longer silently |
|                            |                                           | downgraded, backups can write  |
+---------------------------+----------------------------------------+-------------------------------+
| longhorn backup list       | Manual check instead of trusting the     | Distinguishes a genuinely      |
|                            | UI's cached AVAILABLE status             | broken target from stale state |
+---------------------------+----------------------------------------+-------------------------------+
| Shared folder via Control  | Created through Synology admin UI, not   | File Station can't create      |
| Panel                      | File Station                             | top-level shared folders       |
+---------------------------+----------------------------------------+-------------------------------+
```

## What Actually Worked

Keeping the two backup pipelines **fully independent** — different schedules, different mechanisms, no shared code path — turned out to matter more than I expected. A bug in the etcd snapshot timer has zero chance of silently taking down Longhorn’s backups too, and vice versa. The other habit worth keeping: **when a status looks broken, check it manually before touching the underlying infrastructure.** The `longhorn backup list` command cost thirty seconds and saved me from re-diagnosing an NFS export that was already fine.

One more thing worth planting here for later: the snapshot-shipping script also writes a small metric file for node-exporter to pick up, so backup freshness can eventually be turned into something Prometheus can alert on. That detail matters more than it looks like right now — it comes back later in this series.

## Where This Still Falls Short

Both backup legs exist now, run on schedule, and land on a NAS that isn’t these three machines. But a backup that’s never been tested for restoration is really just a hope, not a plan. Everything set up in this post is only as good as the recovery process actually working when it’s needed — and that’s not something you find out by reading the Longhorn docs, it’s something you find out by actually doing it.

Have you ever discovered a backup wasn’t actually restorable only when you needed it? What changed how you verify backups after that?

This is Part 6 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 5 — From SQLite to a 3-Server etcd Cluster: The Full HA Upgrade](https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 7 — Assume All 3 Machines Die: A Full Disaster Recovery Drill](https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
