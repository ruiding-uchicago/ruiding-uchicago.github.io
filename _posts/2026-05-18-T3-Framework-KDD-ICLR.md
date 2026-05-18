---
layout: post
title: "T³ Framework Accepted to SIGKDD 2026 AI4Science (and ICLR 2026 AI4Mat Spotlight)"
date: 2026-05-18
---

Happy to share that our work proposing the **Text-Twin-Translation (T<sup>3</sup>)** framework has been accepted to the **SIGKDD 2026 AI4Science Track** (CORE A*). The same work was also a **Spotlight Oral at the ICLR 2026 AI4Mat workshop**, presented recently in Brazil.

T<sup>3</sup> addresses the data-scarcity challenge that arises when applying machine learning to complex nanomaterial and device applications. It proposes an end-to-end workflow that integrates **TextGrad** for agentic pipelines with a **device-topology-embedded GNN** for discovery in related data-scarce domains.

## What T<sup>3</sup> does

T<sup>3</sup> targets the data-scarcity problem that pervades ML for complex nanomaterial/device applications, and lays out an end-to-end workflow:

1. **Automated prompt optimization via TextGrad.** A text-gradient method drives an LLM-based agentic pipeline that extracts structured knowledge graphs from an unstructured publication corpus in a low-cost, high-throughput manner.
2. **Device-topology-aware Digital Twin.** A Graph Neural Network that bakes in device-topology physical constraints, trained as a Digital Twin to predict coupled material–device performance.
3. **Validation on an OOD downstream task.** We successfully apply the framework to designing and screening FET sensor probes for detecting PFAS in water.

The framework is designed to extend to other data-scarce material/device domains.

## Links

- Code: [github.com/ruiding-uchicago/T3_FET_sensor](https://github.com/ruiding-uchicago/T3_FET_sensor/tree/main)
- KDD OpenReview: [openreview.net/forum?id=7QfGX651NZ](https://openreview.net/forum?id=7QfGX651NZ#discussion)
- ICLR 2026 AI4Mat workshop: [sites.google.com/view/ai4mat/schedule](https://sites.google.com/view/ai4mat/schedule)

Sincere thanks to my collaborators and to Schmidt Sciences for supporting this work.
