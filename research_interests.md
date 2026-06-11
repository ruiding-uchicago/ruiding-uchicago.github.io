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
    <h2 class="section-title">No-Database Materials &amp; Device Discovery</h2>
</div>

<p>Public databases and benchmarks cover a thin slice of materials science: mostly single crystals, small molecules, idealized surfaces. The systems I work on (FET sensors, membranes, electrocatalytic assemblies) are multi-component and strongly coupled across scales, and one data point can cost days of synthesis and testing. The big data is not coming. So I design AI systems that work the way experimentalists do: pull priors from the literature, build physics-constrained surrogates, and spend the experimental budget where it counts.</p>

<div class="section-header mt-8">
    <span class="eyebrow">Pillar 02</span>
    <h2 class="section-title">Text-Twin-Translation (T<sup>3</sup>) for Device Digital Twins</h2>
</div>

<p><strong>Text:</strong> an agentic pipeline, prompt-optimized with TextGrad, extracts structured knowledge graphs from raw publication corpora (21.8% BLEU improvement in knowledge extraction). <strong>Twin:</strong> a graph neural network that knows the device topology, trained as a digital twin of the coupled material&ndash;device system; on FET sensors it predicts sensitivity with 92.3% accuracy. <strong>Translation:</strong> the twin then screens 123.2 million PubChem compounds for out-of-distribution tasks such as PFAS-sensing probe design. Accepted at SIGKDD 2026 AI4Science; Spotlight Oral at ICLR 2026 AI4Mat.</p>

<figure class="t3-strip anim-onview" role="img" aria-label="Three-stage diagram: papers are distilled into structured fields, the fields assemble into a device topology graph, and the graph scans a candidate cloud where a few candidates light up.">
<svg class="t3-svg" viewBox="0 0 720 235" aria-hidden="true">
  <text class="t3-cap" x="105" y="16" text-anchor="middle">Text</text>
  <text class="t3-cap" x="360" y="16" text-anchor="middle">Twin</text>
  <text class="t3-cap" x="610" y="16" text-anchor="middle">Translation</text>

  <path class="t3-arrow" d="M222 125 H 252 l -7 -5 m 7 5 l -7 5"/>
  <path class="t3-arrow" d="M474 125 H 504 l -7 -5 m 7 5 l -7 5"/>

  <g class="t3-papers">
    <g class="t3-paper tp1" transform="translate(28,52)">
      <rect width="54" height="68" rx="4"/>
      <line x1="9" y1="16" x2="45" y2="16"/><line x1="9" y1="28" x2="45" y2="28"/>
      <line x1="9" y1="40" x2="38" y2="40"/><line x1="9" y1="52" x2="45" y2="52"/>
    </g>
    <g class="t3-paper tp2" transform="translate(44,106) rotate(-4)">
      <rect width="54" height="68" rx="4"/>
      <line x1="9" y1="16" x2="45" y2="16"/><line x1="9" y1="28" x2="40" y2="28"/>
      <line x1="9" y1="40" x2="45" y2="40"/>
    </g>
  </g>
  <g class="t3-fields" transform="translate(126,72)">
    <rect class="tf" x="0" y="0" width="26" height="11" rx="2"/><rect class="tf" x="32" y="0" width="26" height="11" rx="2"/><rect class="tf" x="64" y="0" width="26" height="11" rx="2"/>
    <rect class="tf" x="0" y="18" width="26" height="11" rx="2"/><rect class="tf" x="32" y="18" width="26" height="11" rx="2"/><rect class="tf" x="64" y="18" width="26" height="11" rx="2"/>
    <rect class="tf" x="0" y="36" width="26" height="11" rx="2"/><rect class="tf" x="32" y="36" width="26" height="11" rx="2"/><rect class="tf" x="64" y="36" width="26" height="11" rx="2"/>
    <rect class="tf" x="0" y="54" width="26" height="11" rx="2"/><rect class="tf" x="32" y="54" width="26" height="11" rx="2"/><rect class="tf" x="64" y="54" width="26" height="11" rx="2"/>
  </g>

  <g class="t3-graph" transform="translate(282,42)">
    <line class="t3-edge" pathLength="1" x1="60" y1="38" x2="98" y2="88"/>
    <line class="t3-edge" pathLength="1" x1="140" y1="30" x2="60" y2="38"/>
    <line class="t3-edge" pathLength="1" x1="98" y1="88" x2="28" y2="128"/>
    <line class="t3-edge" pathLength="1" x1="98" y1="88" x2="150" y2="120"/>
    <line class="t3-edge" pathLength="1" x1="140" y1="30" x2="98" y2="88"/>
    <circle class="t3-node tn1" cx="60" cy="38" r="7"/>
    <circle class="t3-node tn2" cx="140" cy="30" r="7"/>
    <circle class="t3-node tn3" cx="98" cy="88" r="9"/>
    <circle class="t3-node tn4" cx="28" cy="128" r="7"/>
    <circle class="t3-node tn5" cx="150" cy="120" r="7"/>
    <text class="t3-nlabel" x="60" y="24" text-anchor="middle">probe</text>
    <text class="t3-nlabel" x="140" y="16" text-anchor="middle">target</text>
    <text class="t3-nlabel" x="98" y="108" text-anchor="middle">channel</text>
    <text class="t3-nlabel" x="28" y="146" text-anchor="middle">medium</text>
    <text class="t3-nlabel" x="150" y="138" text-anchor="middle">env</text>
  </g>

  <g class="t3-cands" transform="translate(528,40)">
    <line class="t3-scan" x1="0" y1="-6" x2="0" y2="160"/>
    <circle class="t3-c" cx="8" cy="14" r="3"/><circle class="t3-c" cx="46" cy="8" r="3"/><circle class="t3-c" cx="86" cy="18" r="3"/><circle class="t3-c" cx="124" cy="10" r="3"/><circle class="t3-c" cx="158" cy="20" r="3"/>
    <circle class="t3-c" cx="18" cy="52" r="3"/><circle class="t3-c win" cx="60" cy="44" r="3"/><circle class="t3-c" cx="98" cy="56" r="3"/><circle class="t3-c" cx="136" cy="48" r="3"/><circle class="t3-c" cx="166" cy="58" r="3"/>
    <circle class="t3-c" cx="10" cy="90" r="3"/><circle class="t3-c" cx="50" cy="96" r="3"/><circle class="t3-c" cx="92" cy="86" r="3"/><circle class="t3-c win" cx="130" cy="94" r="3"/><circle class="t3-c" cx="162" cy="98" r="3"/>
    <circle class="t3-c" cx="22" cy="128" r="3"/><circle class="t3-c" cx="58" cy="136" r="3"/><circle class="t3-c" cx="96" cy="126" r="3"/><circle class="t3-c" cx="134" cy="138" r="3"/><circle class="t3-c win" cx="74" cy="158" r="3"/>
  </g>
</svg>
<figcaption class="t3-legend">
  <details><summary>Text</summary><p>AI reads the literature and extracts structured device knowledge.</p></details>
  <details><summary>Twin</summary><p>The full device context becomes a topology-aware graph.</p></details>
  <details><summary>Translation</summary><p>The twin ranks new candidate materials and molecules.</p></details>
</figcaption>
</figure>

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
