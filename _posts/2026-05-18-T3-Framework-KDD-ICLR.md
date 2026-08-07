---
layout: post
title: "T³ Framework Accepted to SIGKDD 2026 AI4Science (and ICLR 2026 AI4Mat Spotlight)"
date: 2026-05-18
---

Our paper proposing the **Text-Twin-Translation (T<sup>3</sup>)** framework has been accepted to the **SIGKDD 2026 AI4Science Track** (CORE A*). The same work was a **Spotlight Oral at the ICLR 2026 AI4Mat workshop**, presented recently in Brazil.

> **Update:** the paper is now published in the proceedings and available in the ACM Digital Library &mdash; *Proceedings of the 32nd ACM SIGKDD Conference on Knowledge Discovery and Data Mining* (KDD&nbsp;'26), pp.&nbsp;10831&ndash;10841, [doi:10.1145/3770855.3819013](https://dl.acm.org/doi/10.1145/3770855.3819013). There is also a [plain-language summary on Kudos](https://www.growkudos.com/publications/10.1145%25252F3770855.3819013/reader) for readers outside the field.

## Video walkthrough

<video controls preload="metadata" playsinline style="width:100%;border-radius:12px;border:1px solid var(--color-border)">
  <source src="/assets/video/t3-explainer.mp4" type="video/mp4">
  Your browser does not support the video tag — <a href="/assets/video/t3-explainer.mp4">download the video</a>.
</video>

A narrated walkthrough of the full T<sup>3</sup> pipeline — from literature extraction to the device digital twin to PFAS-probe screening.

## What T<sup>3</sup> does

T<sup>3</sup> is our answer to the data scarcity that pervades ML for complex nanomaterial/device applications. The workflow:

1. **Automated prompt optimization via TextGrad.** A text-gradient method drives an LLM-based agentic pipeline that extracts structured knowledge graphs from an unstructured publication corpus, cheaply and at high throughput.
2. **Device-topology-aware Digital Twin.** A Graph Neural Network that bakes in device-topology physical constraints, trained as a Digital Twin to predict coupled material–device performance.
3. **Validation on an OOD downstream task.** We apply the framework to designing and screening FET sensor probes for detecting PFAS in water.

We built it so the same pipeline can be pointed at other data-scarce material/device problems.

## Links

- Published version (ACM DL): [doi:10.1145/3770855.3819013](https://dl.acm.org/doi/10.1145/3770855.3819013)
- Plain-language summary (Kudos): [What this paper found, without the jargon](https://www.growkudos.com/publications/10.1145%25252F3770855.3819013/reader)
- Code: [github.com/ruiding-uchicago/T3_FET_sensor](https://github.com/ruiding-uchicago/T3_FET_sensor/tree/main)
- Reviews and discussion: [OpenReview](https://openreview.net/forum?id=7QfGX651NZ#discussion)
- ICLR 2026 AI4Mat workshop: [sites.google.com/view/ai4mat/schedule](https://sites.google.com/view/ai4mat/schedule)

Thanks to my collaborators and to Schmidt Sciences for supporting this work.
