---
layout: post
title: "Autonomous Research Compiler: An AI Researcher for Functional Materials and Devices"
date: 2026-10-01
---

A membrane that performs beautifully in a half cell can fail in an electrolyzer because of its interface with the catalyst layer. Performance belongs to the assembled system, so interfaces, fabrication, and operating conditions have to be chosen together.

That knowledge sits in the literature, and a paper is not a device record. An article on a PFAS sensor reports a graphene oxide channel, a cyclodextrin receptor, a gate bias, a detection limit. Nothing machine-readable says which parts belong to the same physical device, so no program can ask what happens if the channel is swapped.

The **Autonomous Research Compiler (ARC)** fills that gap. Before any paper is read, a contract is frozen: 13 device families, 93 variants, 231 functional positions, 22 connection types. The compiler may only emit structures the contract allows. **1,388,735 papers** become **5,550,692 typed device graphs**, each recording which components are present, what role each plays, how they connect, and what was measured under which conditions.

A research loop runs on that state. A device twin shared across all 93 variants scores controlled substitutions, judging a candidate inside its device context. A verifier of **49 physics engines** holds sole authority and fails closed: a check that verified nothing returns *inconclusive*, never *pass*. Rejected proposals are revised and retested.

<video controls preload="metadata" playsinline style="width:100%;border-radius:12px;border:1px solid var(--color-border)">
  <source src="/assets/video/arc-console.mp4" type="video/mp4">
  Your browser does not support the video tag &mdash; <a href="/assets/video/arc-console.mp4">download the video</a>.
</video>

One closed-loop run, replayed: *"Can a remote-gate FET report ppt-class PFOS in tap water, and at what bias?"* Agents search, propose, and screen; the verifier returns its verdicts with the evidence, including the ones it refuses to call.

On **25 computational co-design problems** across sensors, catalysts, batteries, separations, and electronic and photonic devices, the loop averages **94.71 out of 100**. Two commercial frontier models score 74.38 and 70.30 under the same solver-based evaluation, and neither abstained on the three problems whose correct answer is to recommend nothing. Widening the search gave new best designs in seven studies, including a 4.04-fold increase in simulated deliverable methane and a sustained battery discharge rate raised from 1.0 C to 1.825 C.

Those scores measure the search, not the corpus: the compiled graphs and the device twin did not enter that comparison. Connecting the two is the next experiment.

Poster at **MRS Fall 2026**, Symposium MT01, with Yuxin Chen and Junhong Chen.
