---
title: "Multiple Nodes Isn't the Same as Highly Available: A Full HA Audit"
slug: "multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit"
author: "Jason Chen"
series: { name: "k3s", part: 11 }
publishedAt: "2026-08-18"
excerpt: "k3s Series 11 — I had 3 servers, replicated storage, a VIP, and no idea whether any of it would actually survive losing a node under real load. So I did the..."
tags: ["Kubernetes", "K3s", "High Availability", "Longhorn", "DevOps"]
sourceUrl: "https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*23usPKWsJW2SXFfSlKFlyQ.png"
---

*k3s Series #11 — I had 3 servers, replicated storage, a VIP, and no idea whether any of it would actually survive losing a node under real load. So I did the math.*

![](https://miro.medium.com/v2/resize:fit:1400/1*23usPKWsJW2SXFfSlKFlyQ.png)

*Three nodes running fine together tells you nothing about what happens when one leaves*

> This is Part 11 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 10 — One IP to Rule the Control Plane: Adding a VIP to k3s HA](https://jason-chen-0604.medium.com/one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha-9125d39aca9b) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 12 — Your k3s HA Might Be Fake: How a Traditional HDD Quietly Undermines etcd](https://jason-chen-0604.medium.com/your-k3s-ha-might-be-fake-how-a-traditional-hdd-quietly-undermines-etcd-7ad25d4771b9)

## TL;DR

Every post so far in this series has added another piece to “high availability” — 3-server etcd, replicated Longhorn storage, a VIP for the control plane. It would have been easy to call the job done there. Instead I ran an actual audit: could this cluster genuinely absorb losing its heaviest-loaded node under real load, or was “3 nodes” just a number that felt safe without ever being tested? The audit found real gaps — and fixing them came with numbers precise enough to actually prove the fix worked.

## Multiple Nodes Is a Fact. Highly Available Is a Claim.

It’s tempting to treat “I have 3 nodes” and “I have HA” as the same statement, and I’d been quietly doing exactly that. They’re not the same claim at all. **“3 nodes” describes the topology. “Highly available” is a claim about what survives losing one of them** — and that claim doesn’t get to just be assumed true because the topology looks right on paper. Proving it meant actually running the numbers instead of trusting the vibe that three machines running fine together must mean any one of them could disappear without consequence.

## The Fix, in One Sentence

Calculate whether the remaining N-1 nodes can actually absorb the full cluster’s resource requests if the heaviest-loaded node disappears, verify that Longhorn’s replicas are genuinely spread across all nodes rather than clustered on two, and audit for hidden single points that no amount of node-counting would catch — then fix what the audit actually finds.

## Quick Start: The N-1 Calculation

```
# Total allocatable resources across every node EXCEPT the heaviest-loaded one
kubectl get nodes -o json | jq '[.items[] | select(.metadata.name != "<heaviest-node>") | .status.allocatable]'

# Total requests across every pod in the cluster
kubectl get pods -A -o json | jq '[.items[].spec.containers[].resources.requests] | add'

# The ratio between these two numbers is the real N-1 answer -
# not "do I have 3 nodes" but "do the other 2 actually have room for everything"
```

Running this against the actual cluster came back at **31% CPU, 13% memory, 62% pod-count headroom** if the heaviest node vanished — genuinely survivable, but only because the math got checked instead of assumed.

## The Audit: Three Things That “3 Nodes” Doesn’t Actually Prove

**Check 1 — the N-1 capacity math, described above.** This is the number most people skip, because “3 nodes, roughly balanced” *feels* like it should be fine. It might be. It also might not, and the only way to know is running the actual arithmetic rather than trusting the feeling. 31/13/62% headroom meant this cluster genuinely could absorb the loss — that’s a real answer, not an assumption dressed up as one.

**Check 2 — whether Longhorn’s replicas are actually spread across all three nodes, not just “healthy.”** A volume reporting `robustness: healthy` tells you it has 3 working replicas. It does not tell you *where* those replicas are. It's entirely possible for all 3 replicas of a volume to end up concentrated on 2 of the 3 nodes — healthy, until specifically the wrong node goes down, at which point that volume loses access exactly the same as if it had never had redundancy at all. Checking this meant looking at actual replica placement, not just the summary status:

```
kubectl get replicas.longhorn.io -n longhorn-system -o json \
  | jq -r '.items[] | "\(.spec.volumeName) \(.spec.nodeID)"' \
  | sort | uniq -c
```

62 volumes, all genuinely spread across all 3 nodes. This was the check most likely to quietly fail without anyone noticing, since a “healthy” badge in the Longhorn UI gives no hint that placement might be concentrated.

## Get 陳昶仲’s stories in your inbox

**Check 3 — hidden single points that node-counting can’t see at all.** This is the category of problem that has nothing to do with node count and everything to do with scheduling constraints nobody was watching. Multi-replica services with no `podAntiAffinity` set can end up with every replica scheduled onto the same node purely by chance, at which point "multi-replica" provides zero actual protection. A critical service pinned to a specific node via `nodeSelector` is a single point of failure no amount of cluster-wide HA can rescue, because it was never eligible to run anywhere else in the first place.

![](https://miro.medium.com/v2/resize:fit:1400/1*jG0C5kCfxGZrvjRYsgU6fw.png)

*“3 nodes” answers none of these three questions on its own*

The Fix: Three Things, Applied Together

Finding the gaps was only half the work — closing them meant three changes, applied as a set rather than individually, because a service missing any one of the three still has a real weakness:

```
# 1. podAntiAffinity — preferred, not required
# required would leave pods stuck Pending on a cluster with
# fewer nodes than replicas; preferred still spreads replicas
# under normal conditions without that failure mode
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels: { app: <service-name> }
        topologyKey: kubernetes.io/hostname
---
# 2. PodDisruptionBudget — guarantees at least one replica
# survives voluntary disruptions (node drains, rolling updates)
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: <service-name>-pdb }
spec:
  minAvailable: 1
  selector:
    matchLabels: { app: <service-name> }
---
# 3. readinessProbe — without this, a pod rescheduled after a
# node failure gets traffic routed to it before it's actually
# ready, producing user-facing 502s during exactly the moment
# HA was supposed to protect against
readinessProbe:
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 5
  periodSeconds: 10
```

These changes went through each project’s own CI/CD pipeline to update manifests properly, rather than patching the live cluster directly — a live patch would just get silently reverted on the next deploy, which defeats the entire point of fixing it.

## Under the Hood

```
+---------------------------+----------------------------------------+-------------------------------+
| Item                      | Before                                   | After                          |
+---------------------------+----------------------------------------+-------------------------------+
| N-1 capacity headroom      | Unverified assumption                    | 31% CPU / 13% mem / 62% pods,  |
|                            |                                          | actually calculated            |
+---------------------------+----------------------------------------+-------------------------------+
| Longhorn replica spread    | "healthy" badge, placement unchecked     | 62/62 volumes confirmed        |
|                            |                                          | spread across all 3 nodes      |
+---------------------------+----------------------------------------+-------------------------------+
| Deployments with all       | 22 deployments concentrated on           | All 22 spread across all       |
| replicas on 1-2 nodes      | 2 nodes                                  | available nodes                |
+---------------------------+----------------------------------------+-------------------------------+
| PodDisruptionBudget         | 0 services covered                       | 21 services covered            |
| coverage                   |                                          |                                |
+---------------------------+----------------------------------------+-------------------------------+
| Services missing            | 8 services with no readinessProbe        | 0 — every service checked      |
| readinessProbe              |                                          | before receiving traffic       |
+---------------------------+----------------------------------------+-------------------------------+
```

## What Actually Worked

The instinct that mattered most here was refusing to let “3 nodes exist” count as evidence on its own — treating HA as a claim that needed a number behind it, not a topology fact that speaks for itself. The other habit worth keeping: **auditing all three layers together** — cluster capacity, storage placement, and scheduling constraints — rather than checking one and assuming the others followed the same pattern. They didn’t; each check found something the other two wouldn’t have caught.

## Where This Still Falls Short

The cluster now has real, verified headroom, correctly spread storage, and scheduling rules that actually protect multi-replica services the way they were always supposed to. What none of this addresses is the layer underneath all of it: etcd’s own tolerance for the specific hardware this cluster runs on. Even a cluster that’s genuinely HA on paper can still be sitting on a foundation with its own hidden limits — and that turned out to be true here in a way worth its own investigation.

Have you audited your own “HA” setup and found the topology was fine but something underneath it wasn’t actually spread the way you assumed? What did you check that surprised you?

> This is Part 11 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 10 — One IP to Rule the Control Plane: Adding a VIP to k3s HA](https://jason-chen-0604.medium.com/one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha-9125d39aca9b) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 12 — Your k3s HA Might Be Fake: How a Traditional HDD Quietly Undermines etcd](https://jason-chen-0604.medium.com/your-k3s-ha-might-be-fake-how-a-traditional-hdd-quietly-undermines-etcd-7ad25d4771b9)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
