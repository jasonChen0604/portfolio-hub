---
title: "Containerd Filled the System Disk: A Two-Phase, Minimal-Downtime Migration"
slug: "containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration"
series: { name: "k3s", part: 14 }
author: "Jason Chen"
publishedAt: "2026-08-20"
excerpt: "k3s Series #14 — Three identical machines. One small decision at join time. Three completely different maintenance bills, years later."
tags: ["Kubernetes", "K3s", "Containerd", "DevOps", "Storage"]
sourceUrl: "https://jason-chen-0604.medium.com/containerd-filled-the-system-disk-a-two-phase-minimal-downtime-migration-06efd876cea3"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*IzlVodGna1U3LzSwYkrnGA.png"
---

*k3s Series #14 — Three identical machines. One small decision at join time. Three completely different maintenance bills, years later.*

![](https://miro.medium.com/v2/resize:fit:1400/1*IzlVodGna1U3LzSwYkrnGA.png)

This is Part 14 of "Running Production Solo: My k3s High-Availability Journey" — Previous: [Part 13 — When You Can't Replace the HDD: Buying etcd More Time](https://jason-chen-0604.medium.com/when-you-cant-replace-the-hdd-buying-etcd-more-time-bd5d3d852629) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 15 — The Discipline Behind All of This](https://jason-chen-0604.medium.com/the-discipline-behind-all-of-this-725a831c327f)

## TL;DR

Three nodes, same batch, same hardware — and the system disk on each one told a completely different story. One sat at 13% used. The other two sat at 65% and 80%, the second one close enough to kubelet's eviction threshold to be a real problem. The difference traced back to a single decision made once, at join time, years apart: whether containerd's image storage got its own disk or got left on the system partition by default. Fixing the two that got it wrong meant migrating 30–38GB of container images with minimal downtime — and the real bottleneck wasn't the data size at all.

## Same Batch, Three Different Bills

Here's the setup that made this worth writing about: three machines from the same build, same base image, same intended configuration. One of them — the earliest one set up — had containerd's image storage carved out onto its own 120GB logical volume from day one, almost as an afterthought at the time. Its system disk sat at a comfortable **13%** used. The other two joined later without that same step, and containerd's images had been quietly accumulating on the 56GB system partition ever since. One sat at **65%** used, containerd alone accounting for 30GB. The other sat at **80%**, containerd at 38GB — close enough to kubelet's nodefs eviction threshold (below 10% free) that it was actively becoming a scheduling risk, not just a tidiness problem.

**Same hardware. Same intended setup. One small decision at join time, and years of accumulation later, one node needed nothing and two needed real surgery.** That gap is the whole point of this post.

## The Fix, in One Sentence

Migrate containerd's image storage onto its own disk using a two-phase rsync — most of the data copied live while k3s keeps running, only a short final sync during actual downtime — because the real bottleneck turns out to be file count, not data volume.

## Quick Start: The Two-Phase Migration

**Phase 1 — pre-sync while the node stays fully in service.** Run this two or three times; each pass narrows the remaining delta:

```
# Zero service impact — k3s and containerd keep running throughout
rsync -aHAX --info=progress2 /var/lib/containerd/ /data/containerd-new/
```

**Phase 2 — the actual downtime window, kept as short as possible:**

```
sudo systemctl stop k3s

# Final incremental sync - data is now static, so this pass is consistent
rsync -aHAX /var/lib/containerd/ /data/containerd-new/

# Rename the old directory instead of deleting it - this is the rollback insurance
sudo mv /var/lib/containerd /var/lib/containerd.old
sudo mkdir /var/lib/containerd

# Update fstab, then verify before rebooting - see Pitfall 2 below
sudo vim /etc/fstab
sudo mount -a # confirm the syntax is valid BEFORE rebooting
sudo systemctl start k3s
sudo reboot
```

## The Pitfalls: Before, During, and After the Migration

**The counter-argument that had to be ruled out first: clearing images doesn't actually help.** Before committing to a migration, the obvious first question is whether the space can just be reclaimed by cleaning up unused images. Checking this properly: **42–44 images existed across the two affected nodes, and almost all of them were genuinely in active use** — multiple versions across prd and qas environments for a dozen-plus projects, each image running 500-775MB. Dangling, truly unreferenced images numbered only **1-4**, reclaiming under 2GB total. The 30-38GB sitting on these disks wasn't waste. It was real, necessary state — meaning the only actual options were expanding the disk or moving it elsewhere, not cleaning it up.

**Pitfall 1 — the real bottleneck isn't the data size, it's the file count, and that changes the whole strategy.** containerd's overlay filesystem layers produce an enormous number of small files — in this case, over **1.23 million** of them. Measuring how much the data actually changes during normal operation showed something worth building the whole plan around: across a full hour of real activity, only **17–30MB** of the 38GB total changed — roughly **0.05%**. The data itself is nearly static. What actually takes time during an rsync against a directory like this isn't transferring bytes, it's **scanning and comparing over a million inodes** to figure out what changed. That reframing is what makes the two-phase approach work: the first two passes absorb almost the entire dataset while the node stays live, and the final pass only has to reconcile a genuinely small delta — which is why the downtime window compresses from what would otherwise be a 20-40 minute full copy down to roughly **5-8 minutes** of scan-plus-increment, a real 5x reduction.

**Pitfall 2 — every rsync pass needs `-aHAX`, or the overlay layers come out broken.** containerd's overlay storage relies heavily on hardlinks and extended attributes to represent its layered filesystem structure efficiently. A plain `rsync -a` silently drops or mishandles both, which either bloats the copy dramatically (hardlinked files get duplicated instead of linked) or corrupts image layers outright. `-aHAX` — preserving hardlinks, ACLs, and extended attributes — isn't optional here.

**Pitfall 3 — a broken fstab line takes you straight to emergency mode on the next boot.** After switching the mount point, it's tempting to reboot immediately to confirm the change took effect. Don't, without checking first: `mount -a` exercises the new fstab entry against the current running system, and any syntax error shows up immediately, in a context you can still recover from at the shell — instead of at boot time, staring at an emergency mode prompt on a node you now need physical or console access to fix.

**One more habit worth keeping through all of this:** rename the old data directory instead of deleting it — `.old`, sitting untouched for a day or two after the migration confirms stable, is a rollback that costs nothing to keep and would be genuinely painful to not have if something surfaces late.

**Service Impact, Honestly Broken Down**

The pre-sync phase carries genuinely zero impact — k3s keeps running the entire time. The downtime window is where the nuance actually lives: multi-replica services didn't notice anything, because the anti-affinity rules from the HA audit earlier in this series meant their other replicas were already running on different nodes. Single-replica stateful services — a standalone database, a Redis instance — saw a real **30 seconds to 2 minutes** gap while their one pod rescheduled onto another node and reattached to the same underlying Longhorn volume. Worth planning around explicitly rather than discovering during the maintenance window. One practical bonus: since this migration already requires stopping k3s and rebooting, it's the natural moment to also apply any pending kernel updates sitting on that node — folding two maintenance needs into one downtime window instead of scheduling them separately.

## The Part That Almost Didn't Make It Into This Post: Coming Back Online

The migration itself went cleanly on all three affected passes. What actually caused the most confusion was the phase after — bringing a freshly rebooted node back into full service — and it's worth documenting as carefully as the migration itself, because both pitfalls here recurred on every single node.

**Return pitfall 1 — a node left in `cordon` state after reboot silently stops Longhorn from healing.** If a node comes back up still marked as cordoned, Longhorn's replicas on that node get stuck: not actively failing, just frozen in a stopped or degraded state, refusing to progress. Pods that needed those volumes sat in ContainerCreating indefinitely. **The fix is about sequencing, and getting it backwards is what causes the problem**: the node needs to be uncordoned the moment it reports Ready — not after waiting for Longhorn to report healthy first. Waiting for "healthy" before uncordoning gets the dependency backwards; Longhorn can't get healthy on a node it's not allowed to schedule onto.

**Return pitfall 2 — a stale mount point left over from the pod's earlier eviction, and a failure that cascades in a genuinely non-obvious direction.** After a pod gets rescheduled off a rebooting node and back on, it occasionally comes up stuck with already mounted or mount point busy, even though the underlying Longhorn volume reports perfectly healthy. `kubectl delete pod` on the stuck pod resolves it cleanly — but the more useful lesson is what happens when the *stuck* pod is a database. Any application depending on that database starts CrashLoopBackOffing with logs pointing at Database is unavailable, which reads like an application-layer problem if you're looking at the app's logs first. **The actual root cause is one layer down and one pod over** — the database's stale mount, not anything wrong with the application itself. The fix is deleting the database pod specifically; the dependent app recovers on its own once the database comes back, with no changes needed on the app side at all.

## An Unplanned Bonus: This Maintenance Accidentally Verified a Real HA Drill

Rolling through all three nodes one at a time — migrate, reboot, uncordon, wait for Longhorn to fully heal, only then move to the next node — turned this routine maintenance into a genuine, if accidental, HA test. kubectl, connected through the VIP from earlier in this series, never dropped a single request across any of the three node cycles; kube-vip handed leadership off cleanly each time a leader node was deliberately cordoned. Multi-replica services stayed up throughout. The one-at-a-time discipline — never touching two nodes simultaneously, since that would drop etcd below quorum — held for all three passes, with the node currently holding VIP leadership always saved for last.

## Under the Hood

| Item | What was done | Effect |
|---|---|---|
| Root cause check | Confirmed images were in active use, not garbage (42-44 images, <2GB reclaimable) | Ruled out cleanup as a solution — migration was actually necessary |
| Two-phase rsync | Pre-sync live (20-40min, zero impact) + final increment during downtime | Downtime cut from 20-40min to 5-8min, ~5x reduction |
| -aHAX on every pass | Preserved hardlinks/ACLs/xattrs | Overlay layers stayed intact, not duplicated or corrupted |
| mount -a before reboot | Verified fstab syntax while still recoverable at the shell | Avoided emergency mode on reboot |
| Uncordon on Ready, not on Longhorn-healthy | Fixed the dependency ordering | Longhorn replicas healed instead of staying frozen |
| One-at-a-time rolling maintenance | Never 2 nodes down simultaneously, VIP leader rebooted last | Zero-downtime kubectl access throughout, accidental HA test |

## What Actually Worked

Reframing the problem from "38GB is a lot to move" to "1.23 million files are a lot to *scan*" was the single insight that made the whole downtime-reduction strategy possible — without that reframing, the two-phase approach wouldn't have looked necessary at all. The other habit worth keeping: treating the "coming back online" phase with the same seriousness as the migration itself. It would have been easy to consider the job done the moment the rsync completed; the two pitfalls that actually caused confusion both happened afterward.

## Where This Still Falls Short

This procedure is now proven across three real nodes, twice — once as the original migration, and implicitly again as the rolling maintenance pattern this series will keep reusing for anything requiring a reboot. What it hasn't covered is a scenario with less margin: what happens if a node fails to come back Ready at all after a reboot, mid-maintenance, with one node already down for the migration and the cluster sitting at reduced capacity. That's a real gap in this runbook, not a hypothetical one, and it's worth having an actual answer for before it happens for real instead of after.

Have you found a small, easy-to-overlook decision made early on that quietly turned into a real maintenance burden years later? What made you finally trace it back to its source?

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)
- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)
- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
