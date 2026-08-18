---
title: "One IP to Rule the Control Plane: Adding a VIP to k3s HA"
slug: "one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha"
author: "Jason Chen"
series: { name: "k3s", part: 10 }
publishedAt: "2026-08-17"
excerpt: "k3s Series 10 — The control plane finally had no single point of failure. My kubectl config still pointed at one. Three servers, one address that doesn’t care..."
tags: ["Kubernetes", "K3s", "High Availability", "DevOps", "Networking"]
sourceUrl: "https://jason-chen-0604.medium.com/one-ip-to-rule-the-control-plane-adding-a-vip-to-k3s-ha-9125d39aca9b"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*xkHC91PqAu6zwC2weVhYYA.png"
---

*k3s Series #10 — The control plane finally had no single point of failure. My kubectl config still pointed at one.*

![](https://miro.medium.com/v2/resize:fit:1400/1*xkHC91PqAu6zwC2weVhYYA.png)

*Three servers, one address that doesn’t care which one is actually in charge*

> This is Part 10 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 9 — Alerting Isn’t Just Adding Rules: The PromQL Traps I Hit](https://jason-chen-0604.medium.com/alerting-isnt-just-adding-rules-the-promql-traps-i-hit-2c152f800a4f) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 11 — Multiple Nodes Isn’t the Same as Highly Available: A Full HA Audit](https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7)

## TL;DR

After the 3-server etcd migration, the cluster itself could survive losing any one node. My own `kubectl` config couldn't — it was still pointed at one node's IP address by habit, meaning the "highly available" cluster still had exactly one door in, and that door was one of the three machines that could go down at any time. Fixing this meant adding a VIP with kube-vip: a floating address that always resolves to whichever server is actually healthy. Getting there meant one certificate error that made perfect sense once I thought about it, one "failure" that turned out to be proof the whole thing was working, and a genuinely satisfying failover test.

## The Single Point of Failure Nobody Was Watching

Here’s an easy blind spot to fall into after finishing an HA migration: the cluster survives losing a node, but does *your own tooling* survive it? My `kubectl` config, my CI pipelines, anything else talking to the API server — all of it had been pointed at one specific node's IP address since before the etcd migration even started, because that's just where the cluster used to live. Three servers now shared etcd quorum and could each independently serve the API. My own connection to that API hadn't caught up — it was still hard-wired to exactly one of them, meaning that one machine going down still meant *I* lost access, even though the cluster underneath kept running fine without it.

## The Fix, in One Sentence

Run kube-vip in ARP mode as a DaemonSet across all three control-plane nodes, so a single floating IP always resolves to whichever server currently holds leadership — no BGP, no external load balancer, just Layer 2.

## Quick Start: kube-vip in ARP Mode

```
# kube-vip as a static pod / DaemonSet on each control-plane node
# ARP mode: same-subnet L2, no BGP peer required
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-vip
  namespace: kube-system
spec:
  selector:
    matchLabels: { app: kube-vip }
  template:
    metadata: { labels: { app: kube-vip } }
    spec:
      containers:
      - name: kube-vip
        image: ghcr.io/kube-vip/kube-vip:latest
        env:
        - name: vip_arp
          value: "true"
        - name: address
          value: "<vip-address>"
        - name: svc_enable
          value: "false"   # only manage 6443, don't touch existing LoadBalancer services
      nodeSelector:
        node-role.kubernetes.io/control-plane: "true"
EOF
```

`svc_enable: "false"` matters here specifically because this cluster already has its own LoadBalancer service handling elsewhere — kube-vip only needs to own the control-plane VIP, not start managing services it has no business touching.

## The Pitfalls: One Real Bug, One Fake One, and One Non-Issue

**Pitfall 1 — the apiserver’s certificate didn’t know the VIP existed, and neither did I until kubectl told me.** The first attempt to point `kubectl` at the new VIP failed with a certificate error — the API server's serving certificate only listed the original node IPs it had been issued for, and the VIP wasn't one of them. This is easy to miss because it's not a kube-vip problem at all; it's a certificate scope problem that only shows up once you actually try to connect through the new address. The fix is adding the VIP to each server's `tls-san` list and restarting k3s on each node so it reissues its serving certificate to include it:

```
# /etc/rancher/k3s/config.yaml on each of the three servers
tls-san:
  - "<vip-address>"
```

```
sudo systemctl restart k3s
```

One node at a time, same discipline as every other rolling change in this series.

## Get 陳昶仲’s stories in your inbox

**Pitfall 2 — a **`**401 Unauthorized**`** response looked like a failure and was actually proof the VIP was working.** Testing basic reachability with `curl -sk https://<vip>:6443/healthz` returned `401 Unauthorized`, and my first reaction was to treat that as the VIP not being wired up correctly. It's the opposite: **a 401 means the request actually reached the API server and got a real, authenticated response back** — `curl` just wasn't presenting a client certificate, so the API server correctly refused to answer without one. That's the API server doing its job, not the VIP failing at its job. The genuine failure signal to watch for instead is `connection refused` or a timeout — either of those would mean the VIP isn't forwarding traffic anywhere at all.

**Pitfall 3 — a port that looks open with **`**/dev/udp**`** might not actually be.** Before assigning the VIP, I wanted to confirm the address wasn't already in use on the network. Testing it with a shell one-liner against `/dev/udp` reported the "port" as reachable — which is misleading, because UDP is connectionless, and `/dev/udp` checks in bash don't perform a real handshake the way a TCP check would. A UDP "connection" succeeding doesn't tell you much of anything about whether something is actually listening. The reliable check here is simpler than the clever one: just `ping` the address and see whether anything answers.

**The failover test was the payoff for all of this.** With the VIP live across all three nodes, I deleted the kube-vip pod on whichever node currently held leadership. Leadership moved to another node within seconds, and `kubectl` — connected the entire time through the VIP, not any individual node's IP — never dropped a single request. That's the actual point of this whole exercise: not that the cluster survives losing a node, which was already true after the etcd migration, but that *I* do too, without needing to know or care which of the three machines happens to be answering at any given moment.

![](https://miro.medium.com/v2/resize:fit:1400/1*6xe96qzBPfZN6_2ocoiTIA.png)

*One real bug, one that looks like a bug and isn’t, and the moment it all pays off*

Under the Hood

```
+---------------------------+----------------------------------------+-------------------------------+
| Item                      | What was done                            | Why it matters                |
+---------------------------+----------------------------------------+-------------------------------+
| kube-vip in ARP mode       | DaemonSet across all 3 control-plane     | No BGP peer needed, works on  |
|                            | nodes                                    | same-subnet L2                |
+---------------------------+----------------------------------------+-------------------------------+
| svc_enable: false          | Scoped kube-vip to only manage 6443      | Doesn't collide with existing |
|                            |                                          | LoadBalancer service handling |
+---------------------------+----------------------------------------+-------------------------------+
| tls-san on all 3 servers   | Added the VIP to the apiserver cert's    | kubectl through the VIP no    |
|                            | SAN list, restarted k3s to reissue       | longer hits a cert mismatch   |
+---------------------------+----------------------------------------+-------------------------------+
| 401, not connection        | Learned to read as success, not failure  | Correctly diagnosed VIP was   |
| refused                    |                                          | already forwarding traffic    |
+---------------------------+----------------------------------------+-------------------------------+
| ping instead of /dev/udp   | Verified the address was actually free   | UDP "connects" don't mean     |
|                            | before assigning it                      | anything is really listening  |
+---------------------------+----------------------------------------+-------------------------------+
```

## What Actually Worked

The habit that mattered most here was **treating an unexpected response as a question before treating it as a failure** — the 401 could have sent me down a debugging path for a problem that didn’t exist, if I’d assumed the obvious reading instead of thinking about what the response actually meant. The failover test itself was worth doing deliberately rather than just trusting the theory — watching `kubectl` genuinely not care that I'd just killed the pod on the leader node is a different kind of confidence than reading kube-vip's documentation and assuming it'll work.

## One More Thing: The Rolling Reboot Rule This Enables

With the VIP in place, rolling maintenance across all three nodes finally has a clean order to follow, and it’s worth stating explicitly since it comes up again later in this series: reboot one node at a time, never two at once — losing two simultaneously drops etcd below quorum. After each node comes back, wait until Longhorn’s replicas on that node return to fully healthy before touching the next one — moving on too early risks genuinely losing replica availability, not just a temporary yellow status. And whichever node currently holds the VIP leadership gets rebooted **last**, since kube-vip hands leadership off cleanly when its pod goes down deliberately, but there’s no reason to test that transition more times than necessary during a routine maintenance window.

## Where This Still Falls Short

The control plane now has both real fault tolerance and a stable address to reach it through — genuinely closing the gap this series has been circling since the etcd migration. What hasn’t been tested yet is whether “3 nodes, replicated data, a VIP” actually adds up to a cluster that survives losing a node under real load, not just in a clean, one-thing-at-a-time test. That’s a different question, and it needed its own investigation.

Have you ever mistaken a request actually succeeding for a failure, because the response wasn’t the one you expected? What made you double-check instead of assuming?

> This is Part 10 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 9 — Alerting Isn’t Just Adding Rules: The PromQL Traps I Hit](https://jason-chen-0604.medium.com/alerting-isnt-just-adding-rules-the-promql-traps-i-hit-2c152f800a4f) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 11 — Multiple Nodes Isn’t the Same as Highly Available: A Full HA Audit](https://jason-chen-0604.medium.com/multiple-nodes-isnt-the-same-as-highly-available-a-full-ha-audit-09c8261591e7)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
