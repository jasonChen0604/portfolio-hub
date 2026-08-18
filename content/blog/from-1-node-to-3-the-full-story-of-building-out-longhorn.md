---
title: "From 1 Node to 3: The Full Story of Building Out Longhorn"
slug: "from-1-node-to-3-the-full-story-of-building-out-longhorn"
author: "Jason Chen"
publishedAt: "2026-08-08"
excerpt: "k3s Series 2 — Every volume in the cluster said “degraded.” Not one of them was actually broken. Three connected nodes, finally enough room for every replica..."
tags: ["Kubernetes", "K3s", "Longhorn", "DevOps", "Self Hosting"]
series: { name: "k3s", part: 2 }
sourceUrl: "https://jason-chen-0604.medium.com/from-1-node-to-3-the-full-story-of-building-out-longhorn-3b26f3f45e60"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*jv9wEp3L_u2MfYl5c1fyLw.png"
---

k3s Series #2 — Every volume in the cluster said “degraded.” Not one of them was actually broken.

![](https://miro.medium.com/v2/resize:fit:1400/1*jv9wEp3L_u2MfYl5c1fyLw.png)

*Three connected nodes, finally enough room for every replica to actually exist*

This is Part 2 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 1 — The Moment a Single Node Couldn’t Keep Up](https://jason-chen-0604.medium.com/the-moment-a-single-node-couldnt-keep-up-it-started-with-a-capacity-report-5367c7ea1edc) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 3 — Longhorn PVC Operations: Shrinking and Growing Storage Without Losing Data](https://jason-chen-0604.medium.com/longhorn-pvc-operations-shrinking-and-growing-storage-without-losing-data-f1ce11ef737d)

## TL;DR

After hardening the kubelet on my single-node k3s cluster, I noticed something odd in the Longhorn dashboard: every single volume — all 60 of them — showed as **degraded**. The StorageClass was set to `numberOfReplicas: 3`, but there was only one node to schedule replicas on. That meant this "production" cluster never actually had real data redundancy. Fixing it meant going from 1 node to 3 — and that turned out to be its own minefield: a password that silently never reached `sudo`, an apt lock left behind by a job from a week earlier, and Longhorn racing ahead of me to schedule replicas onto the wrong disk before I could stop it.

## A Warning Light I’d Been Staring Past

Here’s the thing about “degraded” — it sounds alarming the first time you see it, and then it stops sounding alarming once you see it on *every single volume, every single day*. At that point it just becomes background noise. You stop reading it as a warning and start reading it as “that’s just how this cluster looks.”

That’s exactly the trap I’d fallen into. Sixty volumes, sixty degraded badges, day after day — until I actually looked at *why*. The StorageClass had `numberOfReplicas: 3` baked in from the start, as if I'd always planned for a real multi-node cluster. But there was only one node. Each volume's replica had nowhere else to go. Two out of every three copies of my data simply didn't exist. If that one node had died, "degraded" wouldn't have been the word — it would've been "gone."

## The Fix, in One Sentence

Add two more worker nodes so Longhorn’s replicas actually have somewhere to live, being careful not to disrupt the 180+ pods already running in production while doing it.

## Quick Start: Joining a New Node

Before touching anything, a quick sanity check on why the topology matters — going to 4 control-plane servers doesn’t buy you more fault tolerance, it just makes etcd sync more copies for no benefit. Past 3 servers, additional machines should join as plain workers:

bash

```
# On an existing server node — get the join token
sudo cat /var/lib/rancher/k3s/server/node-token

# Required packages on the new node before joining -
# skip these and Longhorn volumes will fail to attach/mount later
sudo apt-get install -y open-iscsi nfs-common

# Join as a worker (not --cluster-init, not a server flag)
curl -sfL https://get.k3s.io | \
  K3S_URL=https://<server-ip>:6443 \
  K3S_TOKEN=<token> \
  sh -
```

That last command is the one that bit me — more on that below.

## The Pitfalls: Three Nodes, Three Traps

**Pitfall 1 — the install command silently ate its own password.** My first attempt looked reasonable on paper:

bash

```
# What I tried first (don't do this)
ssh new-node "curl -sfL https://get.k3s.io | echo 'mypassword' | sudo -S \
  INSTALL_K3S_VERSION='v1.35.5+k3s1' \
  K3S_URL='https://<server-ip>:6443' \
  K3S_TOKEN='$TOKEN' sh -"
```

It just… hung. No error, no obvious failure, just nothing happening. The reason took a minute to click: **piping into **`**sh -**`** consumes stdin**. The password I'd piped in for `sudo -S` never actually reached `sudo` — it got swallowed by the `sh -` at the end of the pipeline instead. Two commands were fighting over the same input stream, and `sudo` lost.

The fix was splitting it into two separate steps so nothing was competing for stdin — download the script first, then run it with the password fed in through a proper interactive session:

![](https://miro.medium.com/v2/resize:fit:1400/1*xSb4pIZZQA8DwiIb0w8rTQ.png)

*Two commands fighting over the same input stream — sudo lost*

bash

```
# Step 1: download the script, don't pipe it into anything yet
ssh new-node "curl -sfL https://get.k3s.io -o /tmp/k3s-install.sh && chmod +x /tmp/k3s-install.sh"

# Step 2: run it in a real pseudo-terminal, feed the password in separately
ssh -tt new-node "sudo -S env \
  INSTALL_K3S_VERSION='v1.35.5+k3s1' \
  K3S_URL='https://<server-ip>:6443' \
  K3S_TOKEN='$TOKEN' /tmp/k3s-install.sh" <<< "mypassword"
```

**Pitfall 2 — apt was locked by a job that had been dead for a week, except it hadn’t.** Installing `nfs-common` on one of the new nodes failed immediately:

```
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend),
is another process using it?
```

Digging into it, an `apt.systemd.daily update` job had been "running" — according to `ps` — since the previous Sunday, roughly a week earlier. My first instinct was to just kill it and move on. I did, and systemd immediately spawned a *new* daily job to pick up kernel, firmware, and header updates — which meant a fresh apt lock, right when I needed the old one gone.

The real question wasn’t “is something holding the lock,” it was **“is that something actually still doing work, or just stuck.”** I ended up watching two signals together: whether `/var/log/dpkg.log`'s timestamp kept advancing, and whether `dpkg --audit` came back empty. A job that's genuinely working keeps writing to that log; a truly stuck one goes silent. There was also a false-positive scare along the way — a monitoring check reported "lock free" based on a single `pgrep` sample, which turned out to just be catching a brief gap *between* sub-phases of the same job. I ended up requiring three consecutive clear checks before trusting it, rather than acting on the first one.

**Pitfall 3 — Longhorn started scheduling replicas before I finished configuring the disks.** This was the one that actually worried me. The moment a new node hit `Ready`, Longhorn's manager didn't wait around — it immediately created a default disk at `/var/lib/longhorn/` on that node and started scheduling replicas onto it, seconds after join, well before I'd applied any of my custom disk configuration.

My environment’s convention is to use `/data/longhorn`, not the default path — and by the time I noticed, replicas were already landing in the wrong place:

*Longhorn had already auto-scheduled a significant number of replicas onto the default disk on both new nodes before I’d even applied my patch — roughly 45GB on one node, 42GB on the other.*

Rather than trying to race Longhorn and lose, I fixed it in two moves. First, patch in the custom disk path and set `allowScheduling: false` on the default disk so nothing new lands there. Second, for what had already landed, use `evictionRequested: true` on those replicas to migrate them off without any downtime — Longhorn rebuilds a healthy replica elsewhere before dropping the old one, so nothing goes offline mid-move:

![](https://miro.medium.com/v2/resize:fit:1400/1*J_rbfQCFeqK3w6IYiHG0nQ.png)

*Longhorn didn’t wait for the patch — the fix was migrating replicas off afterward, not winning the race*

bash

```
# Disable scheduling on the wrongly-created default disk, per node
kubectl -n longhorn-system edit nodes.longhorn.io <node-name>
# set disks.default-disk.allowScheduling: false

# Evict replicas already sitting there - no downtime, Longhorn
# rebuilds elsewhere first, then drops the old copy
kubectl -n longhorn-system patch replicas.longhorn.io <replica-name> \
  --type=merge -p '{"spec":{"evictionRequested":true}}'
```

I watched `scheduledReplica` count drop from 53 to 0 across both nodes as the migration finished. While I was in there, I also caught a configuration drift I'd missed — the cluster's `default-replica-count` was still set to `1`, out of sync with the StorageClass's `numberOfReplicas: 3`. Fixing that was the moment the story actually closed the loop: **58 volumes ended healthy**, and the "degraded" badges from the opening of this post finally meant nothing was wrong.

One loose end I left for later: one of the new nodes had a pending kernel upgrade (6.8.0–106 → 136) that was installed but not yet active, waiting on a reboot I didn’t want to force mid-migration.

## Under the Hood

```
+------------------------+-------------------------------------+------------------------------+
| Item                   | What was done                        | Effect                        |
+------------------------+-------------------------------------+------------------------------+
| Node topology decision | Kept 3 servers, added workers past   | No extra etcd overhead, real  |
|                        | that instead of a 4th server          | fault tolerance preserved     |
+------------------------+-------------------------------------+------------------------------+
| Two-step join           | Split curl/sudo into separate steps  | Password actually reaches     |
|                        |                                       | sudo, install completes       |
+------------------------+-------------------------------------+------------------------------+
| apt lock diagnosis      | Watched dpkg.log timestamp + audit,  | Distinguished "still working" |
|                        | required 3 consecutive clears        | from "actually stuck"         |
+------------------------+-------------------------------------+------------------------------+
| Longhorn disk patch     | Custom path + allowScheduling:false  | Stopped new replicas landing  |
|                        | on default disk                      | on the wrong disk             |
+------------------------+-------------------------------------+------------------------------+
| Replica eviction        | evictionRequested:true on misplaced  | Zero-downtime migration to    |
|                        | replicas                             | the correct disk               |
+------------------------+-------------------------------------+------------------------------+
| Replica count fix       | default-replica-count 1 → 3          | 58 volumes went from degraded |
|                        |                                       | to healthy                    |
+------------------------+-------------------------------------+------------------------------+
```

## What Actually Worked

Treating the join as **two separate steps instead of one clever one-liner** turned out to matter more than I expected — the moment you’re piping multiple things through the same stdin, you’re trusting that nothing downstream will compete for it, and that’s a fragile assumption. The other habit that paid off was **not trusting a single clean check** on the apt lock — one `pgrep` sample lied to me, and it took a second signal (the log timestamp) to actually trust the result.

## Where This Still Falls Short

Three nodes now exist, and the replica math finally adds up — but this only fixed the *data* layer’s redundancy. The **control plane** is still running on a single server underneath all of this; if that one server goes down, the cluster’s brain goes with it, replicas or not. That gap gets closed in the next part of this series, when the single SQLite-backed server becomes a proper 3-server etcd cluster. There’s also a much deeper Longhorn pitfall I hit later — one that took me from a simple Multi-Attach error all the way down into a corrupted instance-manager — and that one gets its own post, because it deserves the space.

Have you hit a “silent” warning like this — something technically alerting correctly, but so persistent it stopped registering as a problem? How did you catch it?

This is Part 2 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 1 — The Moment a Single Node Couldn’t Keep Up](https://jason-chen-0604.medium.com/the-moment-a-single-node-couldnt-keep-up-it-started-with-a-capacity-report-5367c7ea1edc) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 3 — Longhorn PVC Operations: Shrinking and Growing Storage Without Losing Data](https://jason-chen-0604.medium.com/longhorn-pvc-operations-shrinking-and-growing-storage-without-losing-data-f1ce11ef737d)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
