---
title: "Longhorn PVC Operations: Shrinking and Growing Storage Without Losing Data"
slug: "longhorn-pvc-operations-shrinking-and-growing-storage-without-losing-data"
author: "Jason Chen"
publishedAt: "2026-08-09"
excerpt: "k3s Series 3 — Kubernetes won’t let you shrink a PVC. Once you understand why, the same trick fixes two completely different problems. You can’t resize a PVC..."
tags: ["Kubernetes", "K3s", "Longhorn", "DevOps", "Storage"]
sourceUrl: "https://jason-chen-0604.medium.com/longhorn-pvc-operations-shrinking-and-growing-storage-without-losing-data-f1ce11ef737d"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*F7by0P5becmEgEJMwC1J-A.png"
---

k3s Series #3 — Kubernetes won’t let you shrink a PVC. Once you understand why, the same trick fixes two completely different problems.

![](https://miro.medium.com/v2/resize:fit:1400/1*F7by0P5becmEgEJMwC1J-A.png)

*You can’t resize a PVC down. You can only rebuild it — carefully.*

This is Part 3 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 2 — From 1 Node to 3: The Full Story of Building Out Longhorn](https://jason-chen-0604.medium.com/from-1-node-to-3-the-full-story-of-building-out-longhorn-3b26f3f45e60) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 4 — RWO→RWX: Down the Rabbit Hole to a Corrupted Instance-Manager](https://jason-chen-0604.medium.com/rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager-4b8bf293b443)

## TL;DR

Two completely different incidents — one where I’d over-provisioned a PVC and wanted it smaller, one where a MongoDB StatefulSet crash-looped from disk full and needed more space — turned out to share the exact same underlying fix. **You cannot shrink a PVC, and you cannot always resize one in place either.** What actually works, in both directions, is detaching the workload, rebuilding just the PVC, and reattaching — while keeping the object that owns it alive the whole time.

## The Furniture That’s Nailed to the Floor

Here’s a fact about PVCs that trips people up the first time they hit it: **once a volume is a certain size, it can only get bigger, never smaller.** Not in Longhorn, not in Kubernetes generally. It’s like furniture bolted to the floor — you can build an extension onto it, but you can’t just saw off a piece and call it resized. If it’s too big, your only option is to tear it out and build a new one in its place.

That sounds like a minor inconvenience until you’re the one holding a PVC provisioned way larger than it needs to be, quietly wasting Longhorn replica space across three nodes for no reason. And it gets more interesting when the opposite problem shows up on a **StatefulSet** — where the fix for “too small” turns out to route through the exact same “tear it out and rebuild” logic as the fix for “too big.”

## The Fix, in One Sentence

Whether you’re shrinking an oversized PVC or working around a StatefulSet’s immutable storage template, the underlying move is the same: detach safely, delete only the PVC (not the workload that owns it), and let Kubernetes rebuild the binding — using `--cascade=orphan` as the trick that keeps everything else standing.

## Quick Start: Two Flows, Same Instinct

**Shrinking a Deployment-managed PVC** (the simple case — no `volumeClaimTemplates` involved):

bash

```
# 1. Scale down so nothing is writing to the volume
kubectl scale deployment <name> --replicas=0

# 2. Delete only the oversized PVC
kubectl delete pvc <pvc-name>

# 3. Recreate at the right size (inline YAML, always - see note below)
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: <pvc-name>
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: longhorn
  resources:
    requests:
      storage: 5Gi
EOF

# 4. Scale back up
kubectl scale deployment <name> --replicas=1
```

**Growing a StatefulSet-managed PVC** (the tricky case — `volumeClaimTemplates` gets in the way):

bash

```
# 1. Patch the PVC directly first, if allowVolumeExpansion is true on the StorageClass
kubectl patch pvc <pvc-name> -p '{"spec":{"resources":{"requests":{"storage":"10Gi"}}}}'

# 2. Detach the StatefulSet object WITHOUT touching its pods or PVCs
kubectl delete statefulset <name> --cascade=orphan

# 3. Re-apply the StatefulSet with the updated volumeClaimTemplates size
kubectl apply -f - <<EOF
# ... same StatefulSet manifest, storage size updated to match
EOF
```

That `--cascade=orphan` flag is doing more work than it looks like — the rest of this post is about why it's necessary in both directions.

## The Pitfalls: Two Incidents, One Root Cause

**Case 1 — an oversized PVC I wanted to right-size down.** This one’s conceptually simple once you know the rule, but the practical handling depends entirely on *what kind of data* is on the volume, and that’s where I had to slow down. Not every PVC deserves the same level of caution:

- **Deployment-managed PVCs holding logs or cache**: safe to just delete and recreate. Nothing there was meant to survive anyway.

- **StatefulSet-managed PVCs holding a database** (Postgres, in my case): absolutely not safe to just delete. These need a `pg_dump` backup taken first, the new PVC created, and the data restored back in — skipping the backup step here isn't a shortcut, it's data loss waiting to happen.

- **Redis PVCs**: a middle ground. Queue jobs currently in flight are lost when the volume is rebuilt, but session data rebuilds itself automatically as traffic comes back in — so the risk tolerance here is genuinely different from a primary datastore.

One small efficiency win: if a single deployment mounts multiple PVCs that all need the same treatment, you only need to scale it down once and handle all the PVCs together, rather than cycling the deployment multiple times.

**Case 2 — a StatefulSet that crash-looped from a full disk.** This one started as an operational fire, not a planned cleanup. A MongoDB StatefulSet, three replicas, 500Mi PVCs each, started crash-looping because MongoDB’s FTDC diagnostics process couldn’t write to `diagnostic.data` — the disk was simply full. The volume needed to grow, and I assumed that would be simple. It wasn't, because two *separate* Kubernetes limitations were stacked on top of each other, and I initially treated them as one problem.

The first limitation is real but mild: **online PVC expansion works fine** if the StorageClass has `allowVolumeExpansion: true`. You patch the PVC, and it does resize — but it lands in a `FileSystemResizePending` state until the pod restarts to actually complete the filesystem resize. With three replicas backing a quorum-based database, that restart has to happen one pod at a time, waiting for each to come back `Ready` before touching the next — restart all three at once and you risk losing quorum entirely.

The second limitation is the one that actually stopped me, and it showed up *after* the PVC itself had already resized successfully:

```
The StatefulSet "mongo" is invalid: spec: Forbidden: updates to statefulset spec
for fields other than 'replicas', 'ordinals', 'template', 'updateStrategy',
'revisionHistoryLimit', 'persistentVolumeClaimRetentionPolicy' and 'minReadySeconds'
are forbidden
```

The PVCs were already the right size. The pods were already healthy and running on the resized volumes. But the StatefulSet *object* itself still described the old, smaller size in its `volumeClaimTemplates`, and Kubernetes flatly refuses to let that field change on an existing StatefulSet — no matter how consistent reality already is with what you're asking for. Any CI pipeline running `kubectl apply` from then on would just keep failing on this exact error, forever, until the StatefulSet definition itself was reconciled.

The fix turned out to be the same move as Case 1, just applied to a different object: `kubectl delete statefulset mongo --cascade=orphan`, which detaches the StatefulSet controller from its pods and PVCs without deleting either, then re-applying the StatefulSet manifest with the corrected `volumeClaimTemplates` size. The orphaned pods and PVCs just get adopted back under the new StatefulSet object — nothing restarts, nothing re-provisions, the mismatch simply disappears.

![](https://miro.medium.com/v2/resize:fit:1400/1*8ACTnFkJ2C9ZWAHHCHiiEQ.png)

*Same flag, two completely different incidents — the trick is decoupling the controller object from what it owns*

## Under the Hood

```
+--------------------------+--------------------------------------+-------------------------------+
| Item                     | What was done                          | Effect                         |
+--------------------------+--------------------------------------+-------------------------------+
| Deployment PVC shrink     | Scale down → delete PVC → recreate    | Right-sized storage, no        |
|                          | smaller → scale up                     | orphaned Longhorn replicas     |
+--------------------------+--------------------------------------+-------------------------------+
| Data protection tiering   | log/cache: delete freely;             | Risk matched to what's         |
|                          | database: pg_dump first; queue:        | actually on the volume         |
|                          | accept job loss, sessions self-heal    |                                |
+--------------------------+--------------------------------------+-------------------------------+
| Online PVC expansion      | Patch PVC, restart pods one at a time  | No quorum loss on a            |
|                          |                                        | multi-replica database          |
+--------------------------+--------------------------------------+-------------------------------+
| StatefulSet immutable fix | --cascade=orphan delete + reapply      | Object definition matches      |
|                          | with corrected volumeClaimTemplates    | reality, CI stops failing      |
+--------------------------+--------------------------------------+-------------------------------+
| Manifest output style     | Always inline YAML via heredoc, not    | Works in any target env,       |
|                          | envsubst < template-file               | no missing-template failures   |
+--------------------------+--------------------------------------+-------------------------------+
```

## What Actually Worked

The single most useful thing I took away from both incidents is that `**--cascade=orphan**`** is a general-purpose escape hatch**, not a one-off trick for StatefulSets specifically — it decouples a controller object's lifecycle from the resources it owns, which turns out to be exactly what you need whenever the *object's definition* is wrong but the *underlying resources* are already correct. The other habit worth keeping: treating data protection as a **tiered decision**, not a blanket rule. Deleting a log PVC and deleting a Postgres PVC are not the same action just because the `kubectl delete pvc` command looks identical.

## Where This Still Falls Short

Both incidents here were, in the end, manageable — annoying, but nothing that risked real data loss once handled correctly. That’s not always true. There’s a much deeper Longhorn incident from around the same period that started as a routine RWO-to-RWX migration and ended up with me debugging a corrupted `instance-manager` from inside a distroless container with no shell tools available. That one gets its own post next, because it's a genuinely different category of problem.

Have you run into Kubernetes’ “can’t shrink, can’t always resize in place” quirk elsewhere — ConfigMaps, immutable fields on other resources? Curious what workarounds people have landed on.

This is Part 3 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 2 — From 1 Node to 3: The Full Story of Building Out Longhorn](https://jason-chen-0604.medium.com/from-1-node-to-3-the-full-story-of-building-out-longhorn-3b26f3f45e60) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 4 — RWO→RWX: Down the Rabbit Hole to a Corrupted Instance-Manager](https://jason-chen-0604.medium.com/rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager-4b8bf293b443)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
