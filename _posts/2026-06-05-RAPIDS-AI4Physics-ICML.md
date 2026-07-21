---
layout: post
title: "RAPIDS Accepted at ICML 2026 AI4Physics Workshop"
date: 2026-06-05
---

Our paper **"Geometry, Not Energy Surface, Drives the Neutral MLIP&ndash;DFT Gap in Atomistic Interaction Surrogates"**, the study behind RAPIDS, has been accepted at the AI4Physics workshop at ICML 2026 ([OpenReview](https://openreview.net/forum?id=r2NSBJ4ip7)).

<video controls preload="metadata" playsinline style="width:100%;border-radius:12px;border:1px solid var(--color-border)">
  <source src="/assets/video/rapids-explainer.mp4" type="video/mp4">
  Your browser does not support the video tag &mdash; <a href="/assets/video/rapids-explainer.mp4">download the video</a>.
</video>

A narrated walkthrough of RAPIDS &mdash; what the MLIP&ndash;DFT benchmark measures, and why geometry turns out to be the culprit.

RAPIDS is the rapid physical validation engine of our autonomous discovery stack. It benchmarks machine-learning interatomic potentials (MLIPs) against DFT across **5,567 probe&ndash;target dimer interactions** and **18 benchmark tasks**. The finding behind the title: geometric representation, not the energy surface itself, drives the neutral MLIP&ndash;DFT gap.

The packaging matters as much as the finding. RAPIDS is exposed as a tool autonomous LLM agents can call, so agents like DToR and screening twins like T<sup>3</sup> can get a fast atomistic sanity check before committing to a costly simulation or experiment.

Co-first-authored with Zixin Ding and Rodrigo P. Ferreira, together with Yuxin Chen and Junhong Chen. I'll present it in July.
