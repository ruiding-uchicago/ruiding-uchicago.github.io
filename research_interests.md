---
layout: default
title: "Research"
permalink: /research-interests/
mathjax: true
---

<article class="page-container fade-in">
<div class="section-header">
    <span class="eyebrow">Research Program</span>
    <h1 class="section-title">Four Pillars</h1>
</div>

<p>Complex functional materials and devices sit in a regime mainstream ML-for-science rarely touches: the systems are complicated, every data point is expensive, and there is no database or benchmark to start from. That regime is what my research targets, with an AI co-scientist stack running from hypothesis generation through device digital twins to physical validation.</p>

<div class="section-header mt-8">
    <span class="eyebrow">Pillar 01</span>
    <h2 class="section-title">Data-Scarce, Unbenchmarked Materials &amp; Device Discovery</h2>
</div>

<p>Public databases and benchmarks cover a thin slice of materials science: mostly single crystals, small molecules, idealized surfaces. The systems I work on (FET sensors, membranes, electrocatalytic assemblies) are multi-component and strongly coupled across scales, and one data point can cost days of synthesis and testing. The big data is not coming. So I design AI systems that work the way experimentalists do: pull priors from the literature, build physics-constrained surrogates, and spend the experimental budget where it counts.</p>

<div class="section-header mt-8">
    <span class="eyebrow">Pillar 02</span>
    <h2 class="section-title">Text-Twin-Translation (T<sup>3</sup>) for Device Digital Twins</h2>
</div>

<p><strong>Text:</strong> an agentic pipeline, prompt-optimized with TextGrad, extracts structured knowledge graphs from raw publication corpora (21.8% BLEU improvement in knowledge extraction). <strong>Twin:</strong> a graph neural network that knows the device topology, trained as a digital twin of the coupled material&ndash;device system; on FET sensors it predicts sensitivity with 92.3% accuracy. <strong>Translation:</strong> the twin then screens 123.2 million PubChem compounds for out-of-distribution tasks such as PFAS-sensing probe design. Accepted at SIGKDD 2026 AI4Science; Spotlight Oral at ICLR 2026 AI4Mat.</p>

{% include t3-strip.html %}

<p class="text-muted text-sm">The Twin is a message-passing GNN over the device topology graph: $$h_v^{(k+1)}=\phi\Big(h_v^{(k)},\ \bigoplus_{u\in\mathcal{N}(v)}\psi\big(h_v^{(k)},h_u^{(k)},e_{uv}\big)\Big)$$ where edges $e_{uv}$ encode physical couplings between material, channel, and electrode nodes.</p>

<div class="section-header mt-8">
    <span class="eyebrow">Pillar 03</span>
    <h2 class="section-title">Agentic Hypothesis Generation with DToR</h2>
</div>

<p><strong>Deep Tree of Research (DToR)</strong> is a hypothesis-generation engine, not a chat agent: a local-first RAG system with a tree-structured orchestrator that adaptively expands and prunes research branches for coverage, depth, and coherence. Benchmarked on 27 nanomaterials/device topics against 44 agent configurations, its reports achieved a ~79% mean pairwise win rate against commercial deep-research systems, while running entirely on in-house, consumer-level hardware with open-source LLMs.</p>

<div class="section-header mt-8">
    <span class="eyebrow">Pillar 04</span>
    <h2 class="section-title">Rapid Physical Validation with RAPIDS &amp; Experiments</h2>
</div>

<p><strong>RAPIDS</strong> is the atomistic validation engine of the stack. It benchmarks machine-learning interatomic potentials against DFT on 5,567 probe&ndash;target dimer interactions across 18 benchmarks; the result is that geometry, not the energy surface, drives the neutral MLIP&ndash;DFT gap. It is also packaged as a tool autonomous LLM agents can call for fast physical sanity checks. The last gate is the one I was trained for: nanomaterial synthesis, device fabrication, and electrochemical testing in the wet lab.</p>

{% include fid-slider.html %}

<div class="section-header mt-8">
    <span class="eyebrow">Where It Lands</span>
    <h2 class="section-title">Application Domains</h2>
</div>

<div class="grid grid-cols-3 mt-4">
    <div class="feature-card">
        <h3 class="feature-title">Electrocatalysis</h3>
        <p class="feature-description">Accelerated discovery of OER/HER catalysts for clean hydrogen production.</p>
    </div>
    <div class="feature-card">
        <h3 class="feature-title">Chemical Sensing</h3>
        <p class="feature-description">Neuromorphic approaches for FET sensor design and environmental monitoring.</p>
    </div>
    <div class="feature-card">
        <h3 class="feature-title">Water &amp; Environment</h3>
        <p class="feature-description">PFAS detection probes and AI-guided design of PFAS-selective membrane interfaces.</p>
    </div>
</div>
</article>
