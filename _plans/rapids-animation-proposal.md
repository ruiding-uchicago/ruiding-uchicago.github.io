# RAPIDS explainer: from generic "fidelity ladder" to the paper's routing story

Sources: workshop PDF `ICML_2025_RAPIDS-7.pdf` (cited below as W p.N), poster `RAPIDS_AI4Physics_ICML_poster_2026.pdf` (P). The AAAI manuscript was read for framing only; none of its numbers appear on screen.

## 1. What the paper actually does

1. Task: rank non-covalent probe–target dimers, where 1–2 kcal/mol decides which candidate goes to experiment (W p.1 abstract, §1).
2. Scaffold around the pretrained UMA omol MLIP, no fine-tuning: tiered 9+6+9 orientation scan → LBFGS relaxation of every candidate → four per-configuration guards (topology, geometry, energy, convergence) + scan-level Energy Consistency Guard → pose-ranked relaxed binding score → optional xTB/DFT follow-up (W §3.2 p.3, Fig. 1a/b p.4; P "RAPIDS = search + relaxation + guards").
3. Nine-fidelity log on the same dimers: RAPIDS; three DFT single points on the RAPIDS geometry; three DFT geometry re-optimisations + single point (GeoSP); CREST xTB; CREST xTB+DFT (W §3.1 p.3, §3.4 p.4).
4. Neutral finding: RAPIDS is a viable low-cost screen at 12% of the CREST xTB+DFT cost; a DFT single point on the same geometry changes essentially nothing; geometry re-optimisation is the step that improves things (W §4.3 p.6, Fig. 2 p.7; P "Neutral works").
5. Charged finding: RAPIDS direct output fails sharply and rank order collapses; a DFT single point on the same pose does not close the gap; only geometry-changing arms (DFT GeoSP, CREST sampling) recover (W §4.5 p.7–8; P "Charged fails", "Geometry is the cause").
6. Conclusion / deployment rule: "Neutral: screen with the MLIP • Charged / high-disagreement: escalate geometry" (P one-sentence takeaway; W §5 p.9 "sharp regime boundary").
7. The replay log supports 40 allocation policies; the best replayed selector beats the CREST baseline at 52% of its cost (W §4.4 p.7). Not shown on screen (replay, not deployable rule).
8. Packaging: exposed as an MCP tool / Skill that LLM agents call; PFAS harness (W §3.4 p.4–5, §4.6 p.8).

Dimer count: the workshop PDF says 5,565 throughout (abstract, §1, §3, §4.1); the poster and the site say 5,567. On screen I use 5,567, matching the poster and the existing site copy.

## 2. What the current animation gets wrong

- Its rungs (heuristic → surrogate → MLIP → DFT/MD → experiment) are not RAPIDS' ladder. RAPIDS' cheapest rung IS the MLIP; the ladder above it is DFT single point, DFT geometry re-optimisation, CREST sampling, CREST+DFT.
- Its mechanism ("candidates die as fidelity climbs, the field thins out") is a funnel story. RAPIDS is not a funnel; every dimer is evaluated at every fidelity, and the question is which dimers need which rung.
- It has no notion of the neutral/charged split, no scaffold stages (scan, relax, guards), no geometry-is-the-cause mechanism, no "route per system" conclusion, no agent-tool framing.
- The "n = 40" and cost/accuracy/throughput bars are invented numbers.

## 3. Storyboard (idle cycle ≈ 17.4 s, then restarts; any click/drag pauses it)

The field is 24 dimers (20 neutral, 4 charged, matching the ~16% charged share of the log: IHB100 + BFDb SSI charged, W §4.5 p.7). Each dimer is a target disc plus a probe disc; charged targets carry a "+"/"−" mark.

| # | t (s) | rung label | what the field shows | source |
|---|---|---|---|---|
| 0 | 0–3.6 | MLIP screen | Scaffold strip lights up in sequence: pose scan → relax → guards → score. Probes circle their targets (scan), settle (relax). Neutral dimers settle into contact and turn teal (trusted). Charged dimers settle displaced from their target and turn maroon: rank order lost. Guards pass on all of them (they are catastrophic sentinels, not charged-regime detectors, W p.8 "should be escalated even if guards do not fire" P). Readout: "12% of the reference cost". | W §3.2, Fig. 1 p.3–4; §4.3 p.6; §4.5 p.7 |
| 1 | 3.6–6.0 | DFT point | Every dimer gets a DFT ring but not one atom moves. Neutral: unchanged. Charged: still displaced, still maroon. Caption: "the pose was wrong, not the energy". | W §4.3 p.6 (SP shift ≈ 0), §4.5 p.7 (SP does not close the gap); P "Geometry is the cause" |
| 2 | 6.0–8.6 | DFT re-opt | Atoms move: charged probes snap back into contact and turn olive (recovered). Neutral dimers tighten slightly. Cost bar jumps. | W §4.3 p.6 (geometry is the larger contributor), §4.5 p.8 (GeoSP recovers IHB100) |
| 3 | 8.6–11.0 | CREST | Poses resampled (all dimers wobble and re-settle). Charged recovered by sampling too. Cost near the top. | W §3.3 p.4–5; §4.5 p.8 (CREST xTB overtakes on salt bridges) |
| 4 | 11.0–13.4 | CREST+DFT | Full reference workflow. Every dimer, neutral included, pays the highest cost. Neutral error not better than re-opt. | W §4.3 p.6 (1.80 vs 1.44), Fig. 2 p.7 |
| 5 | 13.4–17.4 | route | The answer. Neutral dimers stay in their cheap teal state with a small "MLIP" tag; charged dimers get an upward arrow and the olive "geometry" state. Cost bar drops back near the MLIP level, both error bars stay low. Caption: "Neutral: screen with the MLIP. Charged or high-disagreement: escalate geometry. Exposed as a tool that LLM agents call." | P takeaway; W §5 p.9; §3.4 p.4–5 |

## 4. What stays

- `figure#fid[data-s]`, the stage buttons, the range input, drag/click interaction, the bars row, the idle demo that pauses for 6 s after user input. Consumers checked with grep: only `assets/js/site.js` [4] and the `.fid-*` Sass block; `index.html` and `research_interests.md` only include the file. Range max goes 4 → 5 (the 6th stop is "route").
- Same visual register: bordered card, mono uppercase stage labels, thin bars, warm palette; teal = trusted, primary = failed, accent olive = recovered/escalated.

## 5. On-screen text inventory

Stage buttons: `MLIP screen`, `DFT point`, `DFT re-opt`, `CREST`, `CREST+DFT`, `route` (W §3.1 p.3 nine arms compressed to five families; "route" from P deployment rule).
Scaffold strip (SVG): `pose scan`, `relax`, `guards`, `score` (W §3.2 p.3, Fig. 1a p.4).
Field legend: `neutral`, `charged` (W §4.1 p.5, §4.5 p.7).
Bars: `cost`, `neutral error`, `charged error` (qualitative, ordered per W Fig. 2 p.7 and §4.5).
Numbers (2 total):
- `5,567 dimers × 9 fidelities` (P header and footer; already on the site; W says 5,565, see §1).
- `12% of the reference cost` shown on the MLIP rung only (W abstract p.1, §4.1 p.5, §4.3 p.6: 14.8 h vs 125.3 h).
Per-rung captions (`.fid-say`):
0. "UMA scores every dimer. Neutral pairs settle right. Charged pairs settle in the wrong pose and rank order is lost." (W §4.3, §4.5; P)
1. "Explicit DFT on the same pose. Nothing moves, nothing improves: the pose was wrong, not the energy." (W §4.3 p.6, §4.5 p.7)
2. "Let DFT move the atoms. Charged pairs snap back. This is the step that matters." (W §4.5 p.8; P "Geometry is the cause")
3. "Resample poses with CREST. Also recovers charged pairs, at most of the reference cost." (W §4.5 p.8, Fig. 2)
4. "The full reference workflow. Every dimer pays full price, including the neutral ones that never needed it." (W §4.3 p.6)
5. "Neutral: screen with the MLIP. Charged or high-disagreement: escalate geometry. Exposed as a tool that LLM agents call." (P takeaway; W §3.4)
Figcaption: "Which fidelity does each dimer need? Drag the ladder. The last stop is the routed answer." (no number)

## 6. Reduced motion, aria, mobile

- `prefers-reduced-motion: reduce`: no idle demo (existing), no keyframes; the figure initialises on the `route` stop so the static frame is the conclusion; drag/click still work with instant state changes.
- `aria-label` on the figure: "Interactive diagram of RAPIDS: 24 probe–target dimers evaluated on a five-rung fidelity ladder, MLIP screen, DFT single point, DFT geometry re-optimisation, CREST sampling, CREST plus DFT. Neutral dimers are already correct at the MLIP rung; charged dimers settle in the wrong pose and only recover when a rung moves the atoms. The last stop routes each dimer by regime: MLIP for neutral, geometry escalation for charged." Range input: aria-label "RAPIDS fidelity rung". Buttons carry visible text.
- 390 px: SVG scales with the card (viewBox 300×176); six stage labels drop to .52rem; bars collapse to a single column stack with the log-size line under them; caption wraps.

## 7. Budget and risks

- Markup ~4 KB (24 dimer groups written out, no runtime DOM creation); Sass ~150 lines; JS ~70 lines. No new dependencies.
- Risk: six mono labels at 390 px are tight; verified with screenshots. Risk: "route" as a 6th slider stop is not a fidelity; the button is styled in the accent colour to mark it as the answer. Risk: dimer count 5,565 vs 5,567 discrepancy between PDF and poster; flagged to the owner.
