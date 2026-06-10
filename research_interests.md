---
layout: default
title: "Research"
permalink: /research-interests/
---

<article class="page-container fade-in">
<div class="section-header">
    <h1 class="section-title">Research: Four Pillars</h1>
</div>

<p>Complex functional materials and devices live in a regime that mainstream ML-for-science rarely touches: <strong>high system complexity, high data cost, and no existing database or benchmark</strong>. My research builds a complete AI co-scientist stack for exactly this regime&mdash;from hypothesis generation, to device digital twins, to rapid physical validation.</p>

<div class="section-header mt-8">
    <h2 class="section-title">Pillar 1 &mdash; No-Database Materials &amp; Device Discovery</h2>
</div>

<p>Public databases and benchmarks cover only a thin slice of materials science: single crystals, small molecules, idealized surfaces. Real functional systems&mdash;FET sensors, membranes, electrocatalytic assemblies&mdash;are multi-component, multi-scale, and strongly coupled, and each data point costs days of synthesis and testing. Instead of waiting for big data that will never arrive, I design AI systems that work the way experimentalists do: extract priors from literature, build physics-constrained surrogates, and spend the experimental budget only where it matters.</p>

<div class="section-header mt-8">
    <h2 class="section-title">Pillar 2 &mdash; Text-Twin-Translation (T<sup>3</sup>) for Device Digital Twins</h2>
</div>

<p><strong>Text:</strong> a TextGrad-optimized agentic pipeline extracts structured knowledge graphs from unstructured publication corpora (21.8% BLEU improvement in knowledge extraction). <strong>Twin:</strong> a device-topology-aware graph neural network is trained as a digital twin of the coupled material&ndash;device system (92.3% sensitivity prediction accuracy on FET sensors). <strong>Translation:</strong> the twin screens candidates at scale&mdash;123.2 million PubChem compounds&mdash;for out-of-distribution downstream tasks such as PFAS-sensing probe design. Accepted at SIGKDD 2026 AI4Science; Spotlight Oral at ICLR 2026 AI4Mat.</p>

<img src="/2025_fig2.png" alt="Cross-Modal Device Digital Twin Framework" class="img-responsive img-rounded img-shadow my-8">

<div class="section-header mt-8">
    <h2 class="section-title">Pillar 3 &mdash; Agentic Hypothesis Generation with DToR</h2>
</div>

<p><strong>Deep Tree of Research (DToR)</strong> is a hypothesis-generation engine, not a chat agent: a local-first RAG system with a tree-structured orchestrator that adaptively expands and prunes research branches for coverage, depth, and coherence. Benchmarked across 27 nanomaterials/device topics against 44 agent configurations, DToR reports achieved a ~79% mean pairwise win rate against commercial deep-research systems&mdash;running entirely on in-house, consumer-level hardware with open-source LLMs.</p>

<img src="/2025_fig1.png" alt="DToR Research Framework" class="img-responsive img-rounded img-shadow my-8">

<div class="section-header mt-8">
    <h2 class="section-title">Pillar 4 &mdash; Rapid Physical Validation with RAPIDS &amp; Experiments</h2>
</div>

<p><strong>RAPIDS</strong> is the atomistic validation engine of the stack: it systematically benchmarks machine-learning interatomic potentials against DFT&mdash;5,567 probe&ndash;target dimer interactions across 18 benchmarks&mdash;showing that geometry, not the energy surface, drives the neutral MLIP&ndash;DFT gap. Critically, RAPIDS is packaged as a tool that autonomous LLM agents can call for fast physical sanity checks. The loop then closes where I started: wet-lab validation through nanomaterial synthesis, device fabrication, and electrochemical testing.</p>

<div class="section-header mt-8">
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
