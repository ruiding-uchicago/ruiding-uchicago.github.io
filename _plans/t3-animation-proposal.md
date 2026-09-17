# T³ strip: expansion proposal

Source: `SIGKDD_T3.pdf`, KDD '26 proceedings (ACM pages 10831–10841). Page numbers below are PDF pages 1–11 (printed page = 10830 + N).

## 1. What the paper actually does

1. Testbed: FET chemical sensors; the goal is to pick probe molecules from a huge database for in-silico validation (p.2, §1; Fig. 1 p.2).
2. Stage I, Text (§4.1, p.3–4; Fig. 1 top, p.2): automatic prompt engineering with TextGrad. A human prompt π₀ is run by an inference LLM on a minibatch of papers to emit JSON; a critique LLM compares the JSON with expert-labelled answers and emits a "textual gradient" that rewrites the prompt; the update is kept only if a BERTScore/ROUGE-1/METEOR committee score improves (Eq. 1–3, p.3). Loop runs over publication batches (Fig. 1).
3. The optimized prompt is then applied to the full corpus: 1,600+ FET-sensor papers → 28 structured fields (materials, device architecture, operating conditions, performance) → JSON database, 2,200+ device records (p.1 abstract; p.4 §4.2; p.9 conclusion).
4. Stage II, Twin (§4.2, p.4; Fig. 2, p.5): each record becomes a heterogeneous device graph. Node types: device components (channel, electrodes, dielectric, substrate), sensing interface (probe, target/analyte, test medium), process/condition parameters (annealing, pH, temperature). Edge types: electrical, capacitive, chemical, process, condition, environment (Fig. 2a caption). Physics motivation: probe–analyte binding → surface charge; Debye screening → surface potential; carrier transport → current (p.4).
5. DTE-GNN (Eq. 4–7, p.4; Fig. 2b): relation-specific message passing with GCNII residuals and jumping knowledge; hierarchical attention readout over channel / probe / target / medium; a parallel residual MLP encodes the probe's molecular fingerprint (320-D Morgan/topology); the two logits are fused through a learnable scalar gate γ; one model predicts three ordinal targets: lower detection limit (LDL), upper detection limit (UDL), sensitivity (p.3 §2b; p.7 §5.2).
6. Twin result: DTE-GNN ranks first on all three targets against 17 tabular/neural baselines; accuracy 87.7% / 85.1% / 92.3% for LDL / UDL / sensitivity (p.1; p.7; Fig. 4a p.8). Removing graph message passing (fingerprint-only) collapses performance (p.7; Fig. 4b).
7. Stage III, Translation (§4.3, p.4): one reference device graph is fixed to the remote-gate PFOS sensor of Wang et al.; only the probe node is swapped. 123,239,643 PubChem molecules are scored (composite of LDL/UDL/sensitivity class probabilities); selectivity = predicted response to PFAS targets (PFOS, PFOA) over interferents (DDS, TCAA). No molecule generation; existing molecules are surfaced.
8. Translation result (§5.3, p.7–9; Fig. 5, p.8): top five composite-score candidates go to DFT. The literature probe β-cyclodextrin binds interferents more strongly than PFOS (ΔΔE +0.68/+0.54 eV). Only one of the five, PubChem CID-91566422, favours PFOS over both interferents (ΔΔE −0.23/−0.31 eV); ESP and explicit-solvent MD support it. It is proposed for wet-lab characterization; the paper contains no wet-lab step.

## 2. What the current strip gets wrong or leaves out

- Text panel shows "papers → chips" only. The paper's Text contribution is the self-improving prompt loop (critic + textual gradient); it is absent.
- Twin panel has 5 untyped nodes (probe/target/channel/medium/env) and untyped edges. The paper's point is a *typed* graph (three node classes, six edge classes) plus a fingerprint branch fused by a gate, predicting three named targets. None of this is shown; "env" is not a node type in the paper.
- Translation panel is a scan over a random cloud with three winners. The paper fixes a device, swaps only the probe, scores 123 M molecules, sends the top five to DFT/MD, and exactly one is PFAS-selective while the literature probe is not. That comparison is the finding and is missing.
- Legend text is generic ("AI reads the literature"). No node/edge or output labels tie to the paper.
- The whole strip finishes at ~4.5 s, then idles for 8.5 s of a 13 s cycle.

## 3. Storyboard (one 26 s cycle, animation ends at ~15.2 s, end frame held ~10 s)

Layout: three panels, each its own SVG (viewBox 230×250), in a CSS grid with arrow glyphs between; total width ≈ 720 as before, height 250. On phones (≤ 640 px) the grid stacks vertically (panels 1.5× larger), arrows point down, and the finished diagram is shown without staging (the figure is taller than the viewport, so a single trigger would play off-screen).

| # | t (s) | Panel | What happens | Paper |
|---|-------|-------|--------------|-------|
| 1 | 0.2–2.0 | Text | `prompt` card, arrow "LLM extracts" → `JSON` card, elbow down to `critique vs expert` card appear in sequence. | Fig. 1 Stage I p.2; §4.1 p.3 |
| 2 | 2.0–3.4 | Text | Dashed return arrow `textual gradient` draws from critique back to prompt, twice (two iterations). At 3.2 the prompt card's border turns gold: the prompt is now optimized. | Eq. 2 p.3; Fig. 1 |
| 3 | 3.4–5.3 | Text | Neutral arrow from the tuned prompt; three-paper stack fades in with `1,600+ papers`; arrow → 12 field chips (2 × 6) pop (channel, electrode, dielectric, substrate, probe, target, medium, anneal, pH, temp, LDL·UDL, sens.). | §4.2 p.4; p.1; p.9 |
| 4 | 5.2–6.9 | Twin | Nodes pop by class: device (maroon) → sensing (teal) → condition (gold); a three-line key fades in; 11 typed edges fade in; a four-row edge key (electrical solid, capacitive dashed, chemical dotted, condition dash-dot), the node labels and four faint ghost nodes (omission cue) fade in. | Fig. 2a p.5; §4.2 p.4 |
| 5 | 6.9–7.7 | Twin | Edges bloom once (message passing); channel node fills. | Eq. 4–5 p.4 |
| 6 | 7.5–9.7 | Twin | A bracket under the whole graph (`graph`) and a barcode `fingerprint` (probe) both feed a circle `γ`; three equal output pills fade in with their accuracies: `LDL 87.7%`, `UDL 85.1%`, `sensitivity 92.3%` (only sensitivity has a light gold fill). | Fig. 2b p.5; Eq. 6 p.4; §5.2 p.7 |
| 7 | 9.4–10.0 | Translation | Small fixed device graph (channel, S, D, medium, `PFOS` target with a small skeletal PFOS glyph) with a dashed empty `probe` slot; candidate cloud fades in labelled `123 M PubChem`. | §4.3 p.4 |
| 8 | 10.0–12.4 | Translation | A candidate dot streams from the cloud into the probe slot three times, 0.8 s each (swap only the probe). | §4.3 p.4 |
| 9 | 12.4–13.6 | Translation | Scan line sweeps the cloud; cloud dims; five dots light up gold (top five by composite score). | §4.3 p.4; §5.3 p.7 |
| 10 | 13.3–14.5 | Translation | Selectivity row: grey dashed `β-CD` plus five gold-stroked hits (`top 5`) over a `DFT binding: PFOS vs DDS · TCAA` baseline with a `ΔΔE` axis (`+ interf.` / `− PFOS`). Only two real bars: β-CD up (favours interferents), one hit down (favours PFOS); the other four hits get identical faint stubs, since the paper gives no ΔΔE for them in the main text. | §5.3 p.7; Fig. 5 p.8 |
| 11 | 14.5–15.2 | Translation | The down-bar hit fills gold; a check drawn directly under its bar, then `PFAS-selective` and `DFT · MD (in silico)` aligned beneath it. | p.7–9 |

Hold to 26 s, then site.js replays (`data-cycle="26000"`, set in the include). The legend is three plain `div.t3-leg` blocks (heading + paragraph), not `<details>`, because site.js closes every open `<details>` on each replay.

## 4. What stays

- `.play` staging, `anim-onview auto-cycle` trigger, `<figure>` + `<figcaption class="t3-legend">` with three blocks (same look as the old `<details>` summaries, no collapsing).
- Paper stack, field-chip grid, node-and-edge graph, scan line over a dot cloud (all reused, now labelled).
- Palette: `--color-primary`, `--color-accent`, `--color-accent-teal`, mono captions; no new colours.

## 5. On-screen text inventory

Numbers (5 total; owner asked for all three accuracies):
- `1,600+ papers`: p.1 abstract ("over 1,600 publications"); p.4 §4.2 ("1600+ papers"); p.9 conclusion.
- `87.7%` (LDL), `85.1%` (UDL), `92.3%` (sensitivity) accuracy: p.1 abstract; p.7 §5.2; Fig. 4a p.8. 92.3% was already on site.
- `123 M PubChem`: p.1 abstract ("over 123 million"); p.4 §4.3 ("123,239,643 PubChem molecules"); p.9. Already on site.

Labels: `Text`, `Twin`, `Translation` (title); `prompt`, `LLM extracts`, `JSON`, `critique`, `vs expert`, `textual gradient` (Fig. 1 p.2; §4.1 p.3); chips `channel electrode dielectric substrate probe target medium anneal pH temp LDL·UDL sens.` (§4.2 p.4; Fig. 2a p.5); key `device`, `sensing`, `condition` (Fig. 2a legend "Device / Sensing / Process/Condition") plus a fourth dashed row `… gates, electrolyte` and four unlabelled ghost nodes with one `…`: the drawn 11 nodes are a subset of Fig. 2a's 16 (device: gate top, dielectric top, floating gate, channel, source, drain, substrate, dielectric bottom, gate bottom; sensing: electrolyte, probe material, surface func., detect target, test medium; process/condition: process annealing, condition); omitted here are the gate stack, electrolyte and surface functionalization; node labels `channel S D dielectric substrate probe target medium anneal pH temp` (§4.2 p.4); edge key `electrical`, `capacitive`, `chemical`, `condition` (§4.2 p.4: conduction, capacitive gating, chemical binding, process/condition links); `graph`, `fingerprint`, `γ`, `gate` (Fig. 2b p.5; Eq. 6 p.4); `LDL`, `UDL`, `sensitivity` (p.3 §2b; p.7); `fixed device`, `probe` (§4.3 p.4); `PFOS`, `DDS`, `TCAA` (§4.3 p.4; §5.3 p.7); PFOS skeletal glyph with `F`, `F`, `SO3−` beside the target label (perfluorooctanesulfonate, p.1 abstract; fixed device of Wang et al. §4.3 p.4); `β-CD`, `top 5` (§5.3 p.7; Fig. 5a p.8); `DFT binding`, `ΔΔE`, `+ interf.`, `− PFOS` (Fig. 5 caption p.8; §5.3 p.7); `PFAS-selective`, `DFT · MD (in silico)` (p.7–9; no wet-lab step in the paper).

Legend (figcaption):
- Text: "An LLM critic compares each extraction with an expert answer and rewrites the prompt. The tuned prompt then reads 1,600+ FET sensor papers into structured records."
- Twin: "Each record becomes a device graph: parts, sensing interface, and process conditions, linked by physical couplings. A graph network plus the probe's fingerprint predicts detection limits and sensitivity."
- Translation: "The device is held fixed and only the probe is swapped. 123 M PubChem molecules are scored; the top hits go to DFT and MD, and one binds PFOS over interferents where the literature probe does not."

## 6. Reduced motion, aria, mobile

- Reduced motion: base CSS is the end state (all elements visible, sensitivity pill gold, winner gold, bars full, scan line and streaming dot hidden). All keyframes live under `prefers-reduced-motion: no-preference`; site.js already skips auto-cycle under PRM.
- aria-label: "Three-stage diagram of T3. Text: an LLM critic refines an extraction prompt with textual gradients, then the prompt turns 1,600 plus FET sensor papers into structured records. Twin: each record becomes a typed device graph of parts, sensing interface and process conditions; a graph network fused with the probe's fingerprint predicts detection limits and sensitivity. Translation: with the device fixed and only the probe swapped, 123 million PubChem molecules are scored; the top five go to DFT and MD, and one is selective for PFOS over interferents where beta-cyclodextrin is not."
- Mobile (≤ 640 px): grid becomes one column; each panel SVG spans the full width (about 1.5× the desktop scale), the two arrow glyphs rotate 90°; the staging media query requires `min-width: 641px`, so phones get the end state at once; panel 1 gets `margin-bottom: -12%` to trim its empty band; legend stacks.

## 7. Budget and risks

- Verified with Playwright (Chrome) against a scratch build served on :4181: frames at 0.5/3/5/7/9.5/11.5/14.5 s, light and dark (`colorScheme`), 1280 and 390 px, on `/` and `/research-interests/`; plus a `reducedMotion: 'reduce'` capture showing the complete static frame. Screenshots are in the T³ scratch dir under `shots/` (first round) and `shots2/` (after the review: 0.5–18 s plus a 30 s frame confirming the legend survives the replay and the second cycle has started, plus reduced motion).

- Include ≈ 180 lines of SVG, Sass block ≈ 630 lines (lines 667–1300 of `_sass/_components.sass`), no JS. Three SVGs instead of one; the total rendered size is the same.
- Type floor is 6.8 px in the 230-unit viewBox (≈ 7 px on desktop, ≈ 10.5 px on a 390-px phone).
- `research_interests.md` uses the same include; the container is the same width so nothing else changes.
- The number `1,600+` is the one addition beyond the two already on the site; it can be dropped by deleting one `<text>` without affecting the beats.
