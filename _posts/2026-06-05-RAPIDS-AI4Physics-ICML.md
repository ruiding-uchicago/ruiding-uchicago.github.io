---
layout: post
title: "RAPIDS Accepted at ICML 2026 AI4Physics Workshop"
date: 2026-06-05
---

Our paper **"Geometry, Not Energy Surface, Drives the Neutral MLIP&ndash;DFT Gap in Atomistic Interaction Surrogates"** &mdash; the study behind **RAPIDS** &mdash; has been accepted at the **AI4Physics workshop at ICML 2026** ([OpenReview](https://openreview.net/forum?id=r2NSBJ4ip7)).

RAPIDS is the rapid physical validation engine of our autonomous discovery stack. It systematically benchmarks machine-learning interatomic potentials (MLIPs) against DFT across **5,567 probe&ndash;target dimer interactions** and **18 benchmark tasks**, and finds that geometric representation &mdash; rather than the energy surface itself &mdash; drives the neutral MLIP&ndash;DFT gap.

Just as important as the finding is the packaging: RAPIDS is exposed as a **tool that autonomous LLM agents can call**, so that hypothesis-generation agents like DToR and screening twins like T<sup>3</sup> can get fast atomistic sanity checks before any costly simulation or experiment is committed.

Co-first-authored with Zixin Ding and Rodrigo P. Ferreira, together with Yuxin Chen and Junhong Chen. Looking forward to presenting this July.
