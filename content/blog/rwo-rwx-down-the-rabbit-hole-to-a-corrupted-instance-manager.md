---
title: "RWO→RWX: Down the Rabbit Hole to a Corrupted Instance-Manager"
slug: "rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager"
author: "Jason Chen"
publishedAt: "2026-08-11"
excerpt: "k3s Series 4 — The error message said “Multi-Attach.” The actual problem was a container that had quietly stopped being able to write to its own disk. What l..."
tags: ["Kubernetes", "K3s", "Longhorn", "DevOps", "Debugging"]
series: { name: "k3s", part: 4 }
sourceUrl: "https://jason-chen-0604.medium.com/rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager-4b8bf293b443"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*9s-n-rQ7YoiSXAWzO3Plkg.png"
---

*k3s Series #4 — The error message said “Multi-Attach.” The actual problem was a container that had quietly stopped being able to write to its own disk.*

![](https://miro.medium.com/v2/resize:fit:1400/1*9s-n-rQ7YoiSXAWzO3Plkg.png)

**What looked like a routine access-mode fix turned into a lesson in reading error messages literally**

This is Part 4 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 3 — Longhorn PVC Operations: Shrinking and Growing Storage Without Losing Data](https://jason-chen-0604.medium.com/longhorn-pvc-operations-shrinking-and-growing-storage-without-losing-data-f1ce11ef737d) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 5 — From SQLite to a 3-Server etcd Cluster: The Full HA Upgrade](https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae)

## TL;DR

A routine RWO-to-RWX migration on a multi-replica deployment hit the textbook `Multi-Attach error` — the kind of problem with a well-known fix. I applied that fix. It didn't work on the next volume. What followed was a much longer investigation into a Longhorn `instance-manager` that had quietly stopped being able to write to its own filesystem, debugged from inside a distroless container with no shell tools to speak of. This is the post where the "known" fix stopped being enough, and the real skill was reading error messages literally instead of pattern-matching them to something familiar.

## The Fix You Already Know, Until It Isn’t Enough

If you’ve run Kubernetes long enough, you’ve probably already met this error:

```
FailedAttachVolume: Multi-Attach error for volume "pvc-xxx"
Volume is already used by pod(s) nest-app-xxx, nest-app-yyy
```

It’s almost comforting in how well-documented it is. A `Deployment` with `replicas >= 2` mounting the same `ReadWriteOnce` PVC, two pods land on different nodes, and RWO simply can't be attached in two places at once. The deployment gets stuck at N-1 out of N ready, the old pod can't be replaced during a rolling update, and — this part matters — **it's architectural, not transient. It won't fix itself.** The fix is well-known too: shrink to a single replica to buy a short maintenance window, back up the data, swap the PVC's access mode to `ReadWriteMany`, restore, scale back out.

I’d done this migration cleanly on a handful of volumes already. Then I hit one that wouldn’t follow the script.

## The Fix, in One Sentence

When the standard RWO→RWX fix doesn’t resolve the attach failure, stop assuming it’s the same problem — read the *specific* wording of the next error message instead of pattern-matching it to the one you already know.

## Quick Start: The Standard Fix (for context)

This part is the well-trodden path, included for contrast with what comes later:

```
# 1. Buy a maintenance window — drop to a single replica
kubectl scale deployment <name> --replicas=1

# 2. Back up whatever's on the volume
kubectl exec <pod> -- tar czf /tmp/backup.tar.gz /data

# 3. Delete the old RWO PVC, create a new RWX one, restore data
kubectl delete pvc <pvc-name>
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: <pvc-name>
spec:
  accessModes: ["ReadWriteMany"]
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi
EOF

# 4. Restore, then scale back out
kubectl scale deployment <name> --replicas=3
```

For most volumes, that’s the whole story. This next volume wasn’t most volumes.

## The Pitfalls: When “Attaching” Never Finishes

**The first sign something was different: the volume never got past **`**attaching**`**.** Not a Multi-Attach error this time — a different, vaguer symptom:

```
FailedAttachVolume: Waiting for volume share to be available
```

Checking the `share-manager` pod that's supposed to be serving this RWX volume, it was stuck at `0/1` ready:

```
Readiness probe failed: cat: /var/run/ganesha.pid: No such file or directory
```

Digging into the volume object itself, `.spec.engineNodeID` was an empty string, and `.status.state` was frozen on `attaching` — not progressing, not failing outright, just stuck. Watching the replicas for that volume, they kept getting recreated under new names, never settling into a stable `running` state.

The actual root cause was buried in the `longhorn-manager` logs, and it took a while to notice it wasn't about permissions at all:

```
failed to create instance: rpc error: code = Unknown desc =
open /var/log/instances/xxx.log: no such file or directory
```

**This is the line that mattered, and it’s easy to misread.** My first instinct was to treat this like a permissions problem — check ownership, check the security context, move on. But the error isn’t `Permission denied`. It's `No such file or directory`. Those are two completely different failure modes, and conflating them would have sent me down the wrong path entirely. `Permission denied` means the process can see the path but isn't allowed to touch it. `No such file or directory` on a *write* operation, on a path that should trivially exist inside a running container, means something more fundamental is wrong with that container's own filesystem — not a permissions policy, an actual internal breakage. In this case: an `instance-manager` pod that had likely been running long enough (over a month, in this case) that something in its internal state had quietly gone bad.

**Confirming that theory was harder than it should have been, because **`**instance-manager**`** is a distroless image.** No `ls`, no `touch`, no `stat` — none of the tools I'd normally reach for to poke at a filesystem. What it does have is a shell with builtins, which turned out to be enough:

```
kubectl -n longhorn-system exec <instance-manager-pod> -c instance-manager -- \
  sh -c 'echo test > /var/log/testfile.log 2>&1 && echo WRITE_OK || echo WRITE_FAIL'
```

`WRITE_FAIL`. That confirmed it: this specific `instance-manager` pod had a broken internal filesystem, not a Longhorn configuration issue, not a permissions issue, and definitely not the same class of problem as the Multi-Attach error that had gotten me looking at this volume in the first place.

**The fix itself was almost anticlimactic after that — delete the pod, let Longhorn recreate it.** But before doing that, it was worth pausing on what “delete this pod” actually meant here. An `instance-manager` isn't scoped to a single volume; it's a per-node process that every Longhorn engine and replica on that node talks to. Deleting it doesn't just fix the one stuck volume — it briefly takes **every replica on that node** offline while they reconnect to the freshly recreated manager. For a single volume that's a non-event. For a node quietly hosting a dozen other healthy volumes, it's a blast radius worth confirming before you pull the trigger.

![](https://miro.medium.com/v2/resize:fit:1400/1*AlAJ_obJC0kMlqumEStQ4A.png)

**Five layers deep — each one looked like the whole problem until the next one showed up**

## Under the Hood

```
+---------------------------+---------------------------------------+-------------------------------+
| Symptom                   | What it actually meant                  | How it was confirmed          |
+---------------------------+---------------------------------------+-------------------------------+
| Multi-Attach error         | RWO PVC shared across replicas on      | Textbook, well-documented      |
|                            | different nodes                        |                                |
+---------------------------+---------------------------------------+-------------------------------+
| Stuck at "attaching"       | share-manager not ready                | describe on the share-manager  |
|                            |                                         | pod                             |
+---------------------------+---------------------------------------+-------------------------------+
| ganesha.pid missing        | share-manager readiness probe failing  | kubectl describe pod            |
+---------------------------+---------------------------------------+-------------------------------+
| "no such file or           | instance-manager's internal filesystem | Read literally, not pattern-    |
| directory" on write        | is broken, not a permissions issue     | matched to "Permission denied"  |
+---------------------------+---------------------------------------+-------------------------------+
| Confirmed broken FS        | Distroless image, no debug tools       | sh builtin write test           |
+---------------------------+---------------------------------------+-------------------------------+
| Fix                        | Delete the instance-manager pod        | Evaluated blast radius first —  |
|                            |                                         | every replica on that node       |
|                            |                                         | briefly reconnects              |
+---------------------------+---------------------------------------+-------------------------------+
```

## What Actually Worked

The habit that mattered most here was refusing to let a familiar-looking error short-circuit the investigation — the moment I noticed this wasn’t resolving like the other Multi-Attach cases, I stopped applying the known fix harder and started reading each subsequent error message for what it literally said, not what it resembled. The second habit worth keeping: **before running a fix, ask what else it touches.** Deleting an `instance-manager` pod is a one-line command with a node-wide blast radius, and that's exactly the kind of action worth pausing on for ten extra seconds before executing.

## Where This Still Falls Short

This incident resolved cleanly once identified, but it left a lingering question I didn’t fully chase down: **why did this specific instance-manager end up in this state in the first place**, beyond “it had been running for a long time.” Longhorn doesn’t make that easy to answer after the fact — by the time you notice the symptom, the process that caused it is long gone. If you’ve found a more precise root cause for instance-manager filesystem corruption, I’d genuinely like to hear it.

Have you had an error message send you down the wrong path because it looked like one you already knew? What tipped you off that it wasn’t the same problem?

This is Part 4 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 3 — Longhorn PVC Operations: Shrinking and Growing Storage Without Losing Data](https://jason-chen-0604.medium.com/longhorn-pvc-operations-shrinking-and-growing-storage-without-losing-data-f1ce11ef737d) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 5 — From SQLite to a 3-Server etcd Cluster: The Full HA Upgrade](https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
