---
title: "From SQLite to a 3-Server etcd Cluster: The Full HA Upgrade"
slug: "from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade"
author: "Jason Chen"
publishedAt: "2026-08-12"
excerpt: "k3s Series 5 — There’s a one-way door in this migration. Cross it, and there’s no going back to the way things were. Three nodes were already running. Only o..."
tags: ["Kubernetes", "K3s", "Etcd", "DevOps", "High Availability"]
series: { name: "k3s", part: 5 }
sourceUrl: "https://jason-chen-0604.medium.com/from-sqlite-to-a-3-server-etcd-cluster-the-full-ha-upgrade-ea9672f465ae"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*IoHpzuOO6zLoskFRQwybCg.png"
---

*k3s Series #5 — There’s a one-way door in this migration. Cross it, and there’s no going back to the way things were.*

![](https://miro.medium.com/v2/resize:fit:1400/1*IoHpzuOO6zLoskFRQwybCg.png)

**Three nodes were already running. Only one of them was actually in charge.**

This is Part 5 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 4 — RWO→RWX: Down the Rabbit Hole to a Corrupted Instance-Manager](https://jason-chen-0604.medium.com/rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager-4b8bf293b443) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 6 — Off-Site Backup: etcd Snapshots and Longhorn’s Double Insurance](https://jason-chen-0604.medium.com/off-site-backup-etcd-snapshots-and-longhorns-double-insurance-026636f46254)

## TL;DR

By this point in the series, I had 3 physical nodes, Longhorn replicating data across all of them, and a VIP-worthy amount of confidence that this was a “highly available” cluster. It wasn’t — not really. Only one of those nodes was actually running the k3s control plane; the other two were plain workers. If that one server died, the whole cluster’s brain went with it, replicas or not. This post is the migration from a single SQLite-backed server to a proper 3-server embedded-etcd cluster — a genuinely irreversible operation, done live, on 180+ running pods, with zero acceptable downtime.

## Two Different Kinds of “Safe,” and I Only Had One of Them

Here’s a distinction that’s easy to blur together until something forces you to separate it: **high availability and backup are not the same problem, and solving one doesn’t solve the other.** HA is about surviving the loss of *one* machine without an outage. Backup is about surviving the loss of *everything*. I’d been building toward the first without fully having it — three nodes, replicated storage, all the right instincts — but the control plane itself, the thing actually running the Kubernetes API and scheduling decisions, was still sitting on a single server backed by SQLite. Losing that one machine wouldn’t have been “degraded service.” It would have been the whole cluster, gone.

Fixing this meant converting from SQLite to k3s’s embedded etcd, distributed across all three servers. And etcd HA has a specific, non-negotiable shape: **it needs all three machines running as full servers, participating in the same quorum.** Not one server with two agents reporting to it — that’s still a single point of failure wearing a disguise. All three, or the fault tolerance is theater.

## The Fix, in One Sentence

Convert the single SQLite server to embedded etcd with `--cluster-init`, then join the two existing worker nodes as full etcd servers one at a time — never two at once — until all three are voting members of the same quorum.

## Quick Start: The Irreversible Step

Before touching anything: **this direction has no undo.** Once a node is initialized into etcd, there’s no clean path back to SQLite. The only safety net is a filesystem-level backup taken *before* the conversion starts:

```
# On the original single-server node — back up the SQLite datastore first.
# If anything goes wrong mid-conversion, this is the only way back.
sudo systemctl stop k3s
sudo cp -a /var/lib/rancher/k3s/server/db /var/lib/rancher/k3s/server/db.backup
sudo systemctl start k3s

# Convert the original server to embedded etcd
sudo systemctl stop k3s

# Edit /etc/rancher/k3s/config.yaml on this node to add:
#   cluster-init: true
sudo systemctl start k3s
```

The rollback point, if something goes wrong before the next server joins:

```
sudo systemctl stop k3s
sudo rm -rf /var/lib/rancher/k3s/server/db
sudo cp -a /var/lib/rancher/k3s/server/db.backup /var/lib/rancher/k3s/server/db
sudo systemctl start k3s
```

## The Pitfalls: Three Servers, Three Ways to Get It Wrong

**Pitfall 1 — overwriting an agent’s config.yaml wholesale erases settings that have nothing to do with etcd.** Converting a worker node into a server means editing its `config.yaml`, and the tempting shortcut is to just replace the whole file with a clean server config. Don't. These nodes had been running as agents for a while, and their config files had accumulated real settings — `kubelet-arg` entries like `max-pods=150`, things set deliberately during earlier tuning. A full overwrite silently deletes all of it. The right move is appending only the two or three lines actually needed for the etcd conversion, leaving everything else in the file untouched.

**Pitfall 2 — converting an agent to a server brings the built-in traefik ingress controller back from the dead.** This one is easy to miss because it doesn’t look related to HA at all. k3s ships with traefik built in, disabled on nodes that were set up with a `disable: traefik` flag — which these worker nodes had, since the cluster actually runs ingress-nginx. But that flag lives in the *agent's* config, and converting the node to a server re-triggers k3s's default bootstrapping behavior, which reinstalls traefik regardless of what the old agent config said. The fix has two parts: make sure `disable: traefik` is explicitly present in the *new* server config before conversion, and clean up anything that already got reinstalled:

```
kubectl -n kube-system delete helmchart traefik traefik-crd
```

Once all three nodes have `disable: traefik` set consistently in their server configs, this stops recurring — but hitting it once, mid-migration, on a live cluster is a good way to lose twenty minutes to a problem that looks like it should be unrelated to what you were actually doing.

**Pitfall 3 — the fragile window between “two servers” and “three servers” is exactly as dangerous as it sounds.** etcd quorum for a 3-node cluster requires 2 out of 3 to be healthy. The moment the second server joins, the cluster is running on exactly 2 — meaning it can tolerate losing *zero* more nodes before quorum breaks. This isn’t a stable state to leave sitting overnight. The only sane move after converting the second node is to immediately continue to the third, closing that window as fast as possible rather than treating it as a natural pause point.

The full migration touched all 180+ running pods’ underlying control plane with **zero pod restarts** — the API server briefly became unreachable during each individual conversion (roughly 1–3 minutes per node), but nothing running on the data plane was ever touched. `kubectl` being unresponsive for a couple of minutes and pods actually going down are very different kinds of "downtime," and it's worth being precise about which one you're actually risking before calling something zero-downtime.

![](https://miro.medium.com/v2/resize:fit:1400/1*l5QjwLBvhh_4HcuIjwxj3A.png)

**The gap between 2 and 3 servers is the one moment this whole plan can’t absorb a second failure**

## Under the Hood

```
+---------------------------+----------------------------------------+-------------------------------+
| Item                      | What was done                            | Why it matters                |
+---------------------------+----------------------------------------+-------------------------------+
| Pre-conversion backup      | Filesystem copy of the SQLite db dir     | Only way back — the etcd       |
|                            | before touching anything                 | conversion has no clean undo   |
+---------------------------+----------------------------------------+-------------------------------+
| cluster-init on server 1   | Converts SQLite → embedded etcd          | Establishes the first etcd     |
|                            |                                          | member                         |
+---------------------------+----------------------------------------+-------------------------------+
| Append, don't overwrite    | kubelet-arg and other agent settings    | Preserves tuning already done  |
| agent configs              | kept intact during conversion            | on those nodes                 |
+---------------------------+----------------------------------------+-------------------------------+
| disable: traefik in server | Set explicitly before converting each   | Prevents traefik reinstalling  |
| config                     | agent, not just left over from before    | itself during conversion       |
+---------------------------+----------------------------------------+-------------------------------+
| Servers 2 and 3 joined     | One at a time, second immediately       | Minimizes time spent in the    |
| back-to-back               | followed by the third                   | fragile 2-of-3 quorum window   |
+---------------------------+----------------------------------------+-------------------------------+
```

## What Actually Worked

Treating the pre-conversion backup as non-negotiable, even though the conversion itself went cleanly, was the right call in hindsight — the whole point of a rollback point is that you don’t get to decide in advance whether you’ll need it. The other thing that paid off was **refusing to treat “two servers joined” as a resting state.** It’s tempting to convert one node, verify everything looks fine, and pick up the third node “tomorrow.” That gap is exactly where this plan is at its most fragile, and closing it fast turned out to matter more than being extra careful about any single conversion step.

## Where This Still Falls Short

The control plane is now genuinely fault-tolerant — any one of the three servers can go down without taking the cluster with it. But HA and backup are still two separate problems, and I’d only just finished solving the first one. If all three machines went down at once — power loss, a bad update, anything short of “one node dies” — there was still nothing standing between that and total data loss. That’s what off-site backup is actually for, and it’s what this series covers next.

Have you had to execute a genuinely irreversible infrastructure change on a live system? What convinced you the rollback plan was solid enough to actually pull the trigger?

This is Part 5 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 4 — RWO→RWX: Down the Rabbit Hole to a Corrupted Instance-Manager](https://jason-chen-0604.medium.com/rwo-rwx-down-the-rabbit-hole-to-a-corrupted-instance-manager-4b8bf293b443) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 6 — Off-Site Backup: etcd Snapshots and Longhorn’s Double Insurance](https://jason-chen-0604.medium.com/off-site-backup-etcd-snapshots-and-longhorns-double-insurance-026636f46254)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
