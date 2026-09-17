# DToR stage of the discovery loop: animation proposal

Target: `<figure id="disc-loop">` on `index.html` (the BRAINIAC loop DToR → T³ → RAPIDS → LAB → FB).
Sources: arXiv 2511.18303 v2 (public; page numbers below are from it) and the journal manuscript
under review (Nat. Comm. draft, 2026-09-11; used for framing only, no numbers taken from it).

## 1. What the paper actually does (its own structure)

1. Problem: system-level (S3–S4) device design needs evidence scattered across heterogeneous sources; the governing laws are not in simulation packages (arXiv p.1–2 §1).
2. Unit: a single Deep Research (DR) instance is an evidence-first loop: query → local RAG first → summarize → complementary query → web search → running summary → reflect → repeat, then finalize (arXiv p.2 §2.1, Fig. S12; journal Methods "Single DR Instance", Fig. S1).
3. Orchestration: DToR treats each DR instance as a Research Node in a budgeted tree. A diversifier turns the user query into orthogonal Perspectives P1, P2, ...; each seeds a branch with a budget (max depth, nodes per branch, total branches) (arXiv p.3 §2.2, Fig. 1).
4. Per node an analyst decides EXPAND / PRUNE (journal adds FINALIZE); EXPAND calls a knowledge-gap explorer that spawns gap-targeted child nodes at depth+1 and decrements the budget; stagnating branches are pruned; at the depth cap EXPAND is coerced to FINALIZE (arXiv p.3 §2.2; journal Methods).
5. Every closed branch is synthesized into a perspective report; a final synthesizer reconciles cross-branch evidence, resolves conflicts, and outputs a provenance-rich consolidated report (arXiv p.3 §2.2; journal Fig. 1a).
6. It runs locally (open-weight models, Ollama/LangGraph, local Chroma corpus); local-first retrieval before web reduces drift and surfaces domain priors (arXiv p.2 §2.1, p.9; journal Methods "Local deployment").
7. Finding: on 27 topics, the best DToR configuration ranks 1st overall in blinded rubric scoring and reaches a 79% mean duel win rate; orchestration (DToR vs single DR) is the dominant effect once a local corpus is present (arXiv p.4–7 §3.2, Fig. 2–3, Conclusion p.10).
8. Dry-lab validation on five tasks (DFT/AIMD) and, in the journal version, a wet-lab PFAS FET sensor: the agent's role is a first-stage architectural filter whose hypotheses are refined by the expert (arXiv p.7–9; journal "Architecture-guided PFAS sensing").
9. Framing in the journal abstract: evidence on composition, interfaces, processing and device operation is dispersed across the literature; DToR produces traceable system-level design hypotheses (journal p.1).

## 2. What the current animation gets wrong or leaves out

- DToR is a 26 px circle labelled "hypothesis" with the caption "generates and organizes research hypotheses from local scientific corpora". Nothing of the tree, the budget, expand/prune, local-first-then-web, or the upward synthesis is visible. The key mechanism of the paper is absent.
- "local scientific corpora" understates it: the paper's node reads the local corpus first and then the web; both are required (removing web search degrades quality, arXiv p.6).
- The T³ sub-label "data-driven surrogates" and RAPIDS "computational oracle" are generic; the papers say device digital twins and MLIP screening with DFT escalation.
- The idle cycle gives every stage the same 2.2 s, so the story never dwells on any mechanism.

## 3. Storyboard (idle cycle ≈ 19.4 s: 2.2 s lead-in, DToR 8.4 s, four stages at 2.2 s; one cycle tells the whole story)

Loop draw-in (existing, 0–2.6 s, unchanged): five nodes pop, arcs draw. Then the stepper starts.

DToR stage, 8.4 s dwell. The inset band under the loop wakes from dim to full and re-grows left to right. A thin bracket from the DToR circle to the band says "this is inside that stage".

| # | t (s in dwell) | On screen | Paper |
|---|---|---|---|
| 1 | 0.0 | Root card "question" appears; caption: "DToR: a question fans out into research perspectives, each with a budget." | §2.2 p.3, Fig. 1 |
| 2 | 0.5 | Three perspective nodes P1 P2 P3 fan out from the root (level 1); edges draw. | §2.2 p.3 "diversifier proposes several orthogonal Perspectives" |
| 3 | 1.3 | Inside each node (legend chip): "local corpus → web → summarize → reflect". Small "local" and "web" chips light in that order. | §2.1 p.2, Fig. S12 |
| 4 | 2.6 | Analyst decision: P1 expands into two gap-targeted children, P2 into one; P3 is pruned (dims, struck). Caption: "Each node reads the local corpus first, then the web. Branches expand toward gaps or get pruned." | §2.2 p.3 "EXPAND, PRUNE ... knowledge gap explorer" |
| 5 | 4.0 | Level 3: one child expands once more; the others finalize (tick). Depth cap reached. | §2.2 p.3 "branches that reach depth or converge are synthesized"; journal Methods FINALIZE |
| 6 | 5.0 | Leaves collapse upward: branch reports converge into "synthesis"; the hypothesis card appears at the right with four lines: composition · interfaces · processing · operation, and a "sources cited" line. Caption: "Leaves are synthesized upward into one traceable, system-level hypothesis." | §2.2 p.3 "final synthesizer ... provenance-rich, consolidated report"; journal abstract |
| 7 | 7.4 | Hypothesis card pulses; the loop arc DToR → T³ lights with a moving dash; caption: "The hypothesis goes to T³." Band dims back. | Loop framing (site) |

T³ 2.2 s: "T³ reads the literature into a topology-aware device digital twin, then ranks candidates against it."
RAPIDS 2.2 s: "RAPIDS screens candidates with a guarded MLIP and escalates to DFT when the system is charged or uncertain."
LAB 2.2 s: "The bench is mine: I synthesize the material and test the device electrochemically."
FB 2.2 s: "Results feed back and update the knowledge state the next round reads."

Interaction: click/focus on DToR replays the inset from beat 1 and shows its three captions in sequence; click on any other stage shows its caption and dims the inset. 6 s after the last pointer/key event the figure resets and the idle cycle resumes (existing logic); a clicked DToR inset is allowed to finish its 8.4 s first.

## 4. What stays

- The five-node loop, its geometry, arcs, draw-in animation (`t3-fade`, `t3-draw`), the `.play` staging via `.anim-onview`, the `#disc-loop` id, the click-to-caption and 6 s idle-resume behaviour, and the figcaption "Click any stage." rest state.
- The inline script is extended (a stage schedule instead of a fixed 2200 ms interval; an inset player), not replaced.

## 5. On-screen text inventory

Loop: DToR / hypothesis; T³ / device digital twins; RAPIDS / numerical simulation / MLIP, DFT when needed; LAB / experiment; FB / feedback; discovery loop. (all existing or from the site's own feature cards)
Inset title: "inside DToR: a tree of research" (arXiv title/§2.2).
Inset labels: question · perspectives · expand · prune · finalize · synthesis · hypothesis (arXiv §2.2 p.3).
Legend chip: "each node: local corpus → web → summarize → reflect" (arXiv §2.1 p.2).
Budget label: "budget: depth · nodes · branches" (arXiv §2.2 p.3, "maximum depth, nodes per branch, and total branches").
Hypothesis card lines: composition · interfaces · processing · operation (journal abstract; framing only) and "each claim cites its source" (arXiv "provenance-rich", p.3).
Captions: as in §3.
Numbers shown: none. (The feature card above the figure already carries "~79%" and "27 topics", both in arXiv p.7 and p.3; the animation adds no numbers.)

## 6. Reduced motion, aria, mobile

- `prefers-reduced-motion: reduce`: no stepper; the inset shows its finished tree at full opacity (root, three perspectives with P3 struck as pruned, children, synthesis, hypothesis card). The loop shows as today.
- aria-label: "The discovery loop: DToR, T3, RAPIDS, the wet lab, and feedback, running as a cycle. An inset opens the DToR stage: a research question fans out into budgeted perspectives; each node reads the local corpus first and then the web; branches expand toward knowledge gaps or are pruned; the leaves are synthesized upward into one traceable, system-level design hypothesis that is handed to T3."
- Mobile (390 px): the SVG scales uniformly (viewBox 720 × 420). Inset labels are 8–9 px in viewBox units (≈4–4.5 px real at 390 px, the same class as the existing sub-labels); the figcaption carries the full sentence at normal font size, so the story is readable even where the inset is small. No horizontal scroll.

## 7. Budget and risks

- Markup: +~70 SVG elements; CSS: +~90 lines in the `.disc-loop` block; JS: the inline script grows from ~50 to ~110 lines. No new dependencies, no new files, no changes to `site.js`.
- SVG viewBox height 260 → 420 (the figure gets ~60% taller on the page).
- Risk: the inset band is always present (dimmed between plays) to avoid layout shift; if the owner prefers it to vanish completely, that is a one-line CSS change (opacity 0 instead of .35).
- Risk: keeping the stepper in JS (per-stage schedule) rather than CSS keyframes means the idle cycle only runs while `.play` is set and reduced-motion is off; that mirrors the existing behaviour.
