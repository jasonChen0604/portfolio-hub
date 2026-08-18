---
title: "Prometheus + External Grafana: Wiring Up Monitoring for Production"
slug: "prometheus-external-grafana-wiring-up-monitoring-for-production"
author: "Jason Chen"
series: { name: "k3s", part: 8 }
publishedAt: "2026-08-15"
excerpt: "k3s Series 8 — HA and backups don’t matter if you’re the last to know something’s wrong. This is the plumbing that closes that gap. The metrics were always..."
tags: ["Kubernetes", "K3s", "Prometheus", "Grafana", "DevOps"]
sourceUrl: "https://jason-chen-0604.medium.com/prometheus-external-grafana-wiring-up-monitoring-for-production-0f821ef6a9f2"
coverImageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*65ZTXtpyj89dXJVgKK7_XQ.png"
---

*k3s Series #8 — HA and backups don’t matter if you’re the last to know something’s wrong. This is the plumbing that closes that gap.*

![](https://miro.medium.com/v2/resize:fit:1400/1*65ZTXtpyj89dXJVgKK7_XQ.png)

*The metrics were always there. Nothing was collecting them.*

> This is Part 8 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 7 — Assume All 3 Machines Die: A Full Disaster Recovery Drill](https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 9 — Alerting Isn’t Just Adding Rules: The PromQL Traps I Hit](https://jason-chen-0604.medium.com/alerting-isnt-just-adding-rules-the-promql-traps-i-hit-2c152f800a4f)

## TL;DR

Everything in this series so far — hardened kubelets, real HA, off-site backups — is worthless if I only find out something broke because a service went down and someone noticed. This post is about wiring up Prometheus and Grafana so the cluster tells on itself before that happens. The architecture is simple by design: Prometheus lives inside the cluster where the metrics already are, and it feeds into a Grafana instance I already run elsewhere rather than standing up a second one. Getting there took two fights — one with Helm’s CRD handling, one with a StorageClass ambiguity that had been sitting in the cluster unnoticed the whole time.

## Instrumented Isn’t the Same as Watched

Every piece of infrastructure in this series has been quietly emitting signals about its own health this whole time — kubelet metrics, etcd’s fsync latency, Longhorn’s replica states, all of it. None of that mattered, because nothing was collecting it. There’s a difference between a system that’s *instrumented* and a system that’s actually *watched*, and up to this point I’d only had the former. The gap between those two states is exactly where an outage sits undetected long enough to become a real problem instead of a footnote.

## The Fix, in One Sentence

Run Prometheus inside the cluster, close to the metrics it needs to scrape, and point it at a Grafana instance that already exists outside the cluster — one new data source, not a second Grafana to maintain.

## Quick Start: The Stack

```
# kube-prometheus-stack via Helm — Prometheus + the Operator + CRDs, all in one chart
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f kps-values.yaml
```

A minimal `kps-values.yaml` worth starting from:

```
prometheus:
  prometheusSpec:
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: longhorn
          resources:
            requests:
              storage: 20Gi
# This stack ships its own Grafana by default - disable it,
# since we're pointing at an existing external instance instead
grafana:
  enabled: false
```

Then, in the existing external Grafana, add Prometheus as a data source pointing at the in-cluster service (via whatever ingress or tunnel already exposes cluster services externally) — no new Grafana deployment, no second dashboard system to keep in sync.

## The Pitfalls: Two Fights Before the First Metric Showed Up

**Pitfall 1 — the first install failure was actually a success in disguise.** Running `helm install` the first time failed with something like:

```
Error: unable to build kubernetes objects from release manifest:
resource mapping not found for name: "..." namespace: "..." from "":
no matches for kind "ServiceMonitor" in version "monitoring.coreos.com/v1"
```

The obvious read is “the CRDs aren’t installed, this failed, try again from scratch.” What’s actually going on with Helm v4 is subtler: **it doesn’t auto-install CRDs bundled in a chart before applying the rest of the manifest**, so the first `helm install` attempt fails partway through — but the CRDs it managed to apply *before* hitting the missing-kind error are still sitting in the cluster. The fix is almost anticlimactic: just run `helm install` again. The CRDs are already there from the failed first pass, and the second attempt completes cleanly.

## Get 陳昶仲’s stories in your inbox

The tempting-but-wrong move here is installing a separate `prometheus-operator-crds` chart to "properly" handle the CRDs first. Don't — that chart sets its own Helm ownership labels on those CRD objects, and when `kube-prometheus-stack` later tries to manage the same CRDs under its own ownership, the two conflict and the install fails again, in a more confusing way than the original error.

**Pitfall 2 — two default StorageClasses had been quietly coexisting in the cluster.** Prometheus’s PVC came up bound to the wrong storage class, silently, with no error — just not the one intended. Checking `kubectl get storageclass` revealed the actual issue: **two StorageClasses were both marked as the cluster's default**, a state Kubernetes allows without complaint even though it shouldn't really happen. When more than one StorageClass claims to be default, which one an unspecified PVC actually binds to isn't something worth relying on — the fix is simply never leaving it unspecified:

```
storageSpec:
  volumeClaimTemplate:
    spec:
      storageClassName: longhorn   # explicit, not left to the ambiguous default
```

Worth checking for this ambiguity in any cluster before assuming a PVC without an explicit `storageClassName` will land where you expect — it's an easy thing to have sitting unnoticed for a long time, since most workloads don't care which StorageClass they get until one of them behaves differently.

**One more thing worth flagging, even though it never bit me directly:** don’t reach for an old, frequently-referenced chart version out of habit or an old bookmark — metric names get renamed often enough in this ecosystem that a stale chart version can leave dashboards quietly full of `N/A` panels where renamed metrics used to be, with no obvious error pointing at the version mismatch as the cause.

![](https://miro.medium.com/v2/resize:fit:1400/1*SbOuxC7baI8JDkxHAMfmCA.png)

*Nothing errors. The PVC just binds somewhere you didn’t choose.*

Under the Hood

```
+---------------------------+----------------------------------------+-------------------------------+
| Item                      | What was done                            | Why it matters                |
+---------------------------+----------------------------------------+-------------------------------+
| Prometheus in-cluster      | kube-prometheus-stack via Helm           | Close to the metrics it        |
|                            |                                          | scrapes, no network hop        |
+---------------------------+----------------------------------------+-------------------------------+
| Grafana kept external      | grafana.enabled: false, added as a       | One dashboard system to        |
|                            | data source on the existing instance     | maintain, not two              |
+---------------------------+----------------------------------------+-------------------------------+
| Re-run helm install        | Instead of debugging the first CRD       | CRDs from the failed first     |
| on CRD failure             | error as a standalone problem            | pass are already applied       |
+---------------------------+----------------------------------------+-------------------------------+
| Explicit storageClassName  | Set on the Prometheus PVC, not left      | Avoids binding to the wrong    |
|                            | to the ambiguous cluster default         | one of two competing defaults  |
+---------------------------+----------------------------------------+-------------------------------+
```

## What Actually Worked

The instinct that paid off here was treating the first Helm failure as **information, not a dead end** — reading the actual error closely enough to notice it was a CRD-ordering quirk, not a sign the whole approach needed rethinking. The other thing worth keeping: checking `kubectl get storageclass` for ambiguous defaults *before* deploying anything stateful into a cluster I hadn't fully audited yet, rather than after a PVC silently landed somewhere unexpected.

## Where This Still Falls Short

Metrics are flowing now, dashboards exist, and I can actually see what’s happening across the cluster instead of guessing. But collecting metrics and turning them into something that reliably wakes me up when something’s actually wrong are two different problems. The alerting layer on top of this — and the PromQL mistakes I made getting there — is its own story, and a longer one than this post had room for.

Have you ever traced a Helm install failure back to a CRD-ordering issue rather than a real configuration problem? What tipped you off it wasn’t what it looked like?

> This is Part 8 of “Running Production Solo: My k3s High-Availability Journey” Previous: [Part 7 — Assume All 3 Machines Die: A Full Disaster Recovery Drill](https://jason-chen-0604.medium.com/assume-all-3-machines-die-a-full-disaster-recovery-drill-3023fd2e7f93) ｜ Series overview: [Running Production Solo — Series Overview](https://jason-chen-0604.medium.com/running-production-solo-my-k3s-high-availability-journey-series-overview-185da0289ace) ｜ Next: [Part 9 — Alerting Isn’t Just Adding Rules: The PromQL Traps I Hit](https://jason-chen-0604.medium.com/alerting-isnt-just-adding-rules-the-promql-traps-i-hit-2c152f800a4f)

- GitHub: [jasonChen0604](https://github.com/jasonChen0604)

- Portfolio: [jason-chen-1cb56.web.app](https://jason-chen-1cb56.web.app/)

- LinkedIn: [jason-cj-chen](https://www.linkedin.com/in/jason-cj-chen/)
