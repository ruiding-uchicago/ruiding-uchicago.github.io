---
layout: post
title: "Building an Autonomous Discovery Loop: DToR + T³ + RAPIDS"
date: 2026-06-10
---

Three threads of our work from the past two years are now mature enough to wire together into one **autonomous discovery loop** for the no-database regime of materials and device discovery.

**1. Hypothesis generation: DToR.** A local-first deep-research agent with a tree-structured orchestrator that adaptively expands and prunes research branches. Across 27 nanomaterials/device topics in a 44-agent benchmark, its reports achieved a ~79% mean pairwise win rate against commercial deep-research systems, running entirely on consumer-level hardware with open-source LLMs ([arXiv](https://arxiv.org/abs/2511.18303)).

**2. Device digital twins: T<sup>3</sup>.** Text-Twin-Translation converts unstructured literature into structured knowledge (TextGrad-optimized extraction, +21.8% BLEU), trains a device-topology-aware GNN as a digital twin (92.3% sensitivity prediction accuracy), and screens candidates at scale: 123.2 million PubChem compounds ([OpenReview](https://openreview.net/forum?id=7QfGX651NZ), [code](https://github.com/ruiding-uchicago/T3_FET_sensor)).

**3. Rapid physical validation: RAPIDS.** An atomistic validation engine benchmarking MLIPs against DFT over 5,567 probe&ndash;target dimers and 18 tasks, packaged as a callable tool for autonomous agents ([OpenReview](https://openreview.net/forum?id=r2NSBJ4ip7)).

Each of these is a paper on its own. Chained together under **BRAINIAC**, they start to look like an AI co-scientist: DToR proposes, T<sup>3</sup> screens, RAPIDS verifies, and the wet lab only gets involved once a candidate has survived all three gates.

The first full end-to-end test is now funded: our 2026 Schmidt Seed Fund project on **PFAS-selective membrane interfaces** will run this loop from autonomous design all the way to experimental validation.
