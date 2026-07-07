# Point Roster Spec — hard-region map (2D + 3D + holograms)

> Status: **v1 APPROVED IN FULL (owner, 2026-07-06)** — roster as specced (19 points, two-tier
> labels, the three credibility exclusions, SrTiO₃ swap); hard-region.js DELIBERATELY UNFROZEN
> for pure data appends + the two label-guard one-liners ONLY; 3D module byte cap renegotiated
> 41,088 → 43,008 (42 KiB). Examine hierarchy ruling: TIERED — full ceremony (camera flight +
> dim + big panel) exclusive to the hard five; bench/disc clicks = hologram enlarge ≤2× +
> rotation + info fill, no camera flight.
> Feeds [[hard-region-holograms-proposal.md]]. `_plans/` is not rendered by Jekyll.

Ground truth verified by the agent: field()/ramp math, both renderers' label machinery, the
3D collision guard (`len·7.7 × 18 px`, vertical-only, priority zone>hard>minor), arc anchors
(head-indexed → appends safe), figure geometries (in-page ~1102×689; phone ~358×374; 2D canvas
labels 9.5 px drawn when W>480 or tour-active).

## A. Zone narratives (hover/tour copy, site voice)

**data-rich · benchmarked** — charted territory. data arrives by download: hundreds of thousands
to millions of entries, standard splits, leaderboards with small error bars. methods prove
themselves here before they matter anywhere else. this is also where the stack forages — T³ pulls
its candidate pool from these lowlands.

**active discovery** — half-charted. these fields now have what the lowlands promised: large
datasets, high-throughput pipelines, an established screening playbook. mainstream
ML-for-materials already delivers here — which is the point. they are stepping stones, not the
destination; they are no longer the hard part.

**data-scarce / unbenchmarked** — no database to download, no benchmark to win. systems are
multi-component and coupled across scales — probe to channel to membrane to device — and one data
point is a built, tested assembly. this is the territory the co-scientist stack exists for:
literature priors, physics-constrained twins, experiments spent where they count.

## B. Roster (19 named: bench 8 = 5 labeled + 3 minor; disc 6 = 5 labeled + 1 minor; hard 5 as-is)

Existing coordinates (collision avoid-list): bench (0.10,0.10) (0.17,0.165) (0.30,0.085);
disc (0.36,0.36) (0.50,0.30) (0.55,0.44); hard (0.63,0.74) (0.76,0.92) (0.90,0.69) (0.71,0.59)
(0.94,0.84). Reserved: 2D zone titles (16%,77%) (41%,52%) (82%,4%); 3D zone anchors (0.13,0.33)
(0.41,0.48) (0.42,1.03).

### Zone 1 — benchmark-rich lowlands (teal)

| label | (u,v) | status | one-line copy | hologram + source |
|---|---|---|---|---|
| QM9 | 0.10, 0.10 | existing, labeled | 134k small organic molecules, 13 DFT properties each. the first benchmark every molecular model meets. | benzene ball-and-stick — PubChem CID 241 |
| Materials Project | 0.17, 0.165 | existing, labeled | 150k+ inorganic crystals with computed properties, one API call away. the reference atlas of crystal space. | NaCl rock-salt cell — MP mp-22862 |
| OC20 | 0.30, 0.085 | existing, labeled | 1.3M DFT relaxations of adsorbate–catalyst surfaces. adsorption ML at industrial scale. | Cu(111) slab + \*CO — parametric |
| **PubChem** | 0.045, 0.045 | **new, labeled** | 119M compounds, one download away. T³ screens 123M of these against device twins — raw material, not the bottleneck. | caffeine — PubChem CID 2519 |
| **AFLOW** | 0.235, 0.045 | **new, labeled** | 3.5M computed compounds and the prototype encyclopedia. crystal space, enumerated. | MgAl₂O₄ spinel cell (verify prototype at bake) |
| **OQMD** | 0.07, 0.21 | **new, minor dot** | 1.2M DFT formation energies. thermodynamic stability is a table lookup. | Cu₂MnAl Heusler L2₁ — parametric |
| **MD17** | 0.16, 0.04 | **new, minor dot** | DFT trajectories of ten small molecules — the standard MLIP training set. potentials arrive pre-benchmarked here. | aspirin + ghosted frames — CID 2244 |
| **MatBench** | 0.24, 0.20 | **new, minor dot** | 13 standard tasks for crystal property prediction; leaderboards near saturation. progress here is measured, not discovered. | Si diamond-cubic — mp-149 |

### Zone 2 — active discovery (champagne)

| label | (u,v) | status | one-line copy | hologram + source |
|---|---|---|---|---|
| perovskites | 0.36, 0.36 | existing, labeled | high-throughput synthesis and large optoelectronic datasets. the screening playbook is established — no longer the hard part. | **SrTiO₃ Pm3̄m** + octahedra — mp-5229 (NOT CaTiO₃: cubic phase only stable >1580 K; ground state Pnma — caption bug caught) |
| MOFs | 0.50, 0.30 | existing, labeled | hundreds of thousands of structures in CoRE-MOF and hMOF; GCMC screening is routine. a vast design space with a charted pipeline. | MOF-5 Zn₄O(BDC)₃ cage — CSD SAHYIK |
| alloys | 0.55, 0.44 | existing, labeled | CALPHAD plus high-throughput DFT settle phase stability at scale. composition space yields to enumeration. | random-occupancy FCC supercell — parametric, monochrome (size/brightness = element) |
| **zeolites** | 0.37, 0.26 | **new, labeled** | ~250 known frameworks, millions hypothesized, one curated atlas (IZA). templated synthesis is codified — the first step out of the lowlands. | sodalite β-cage — IZA SOD |
| **2D materials** | 0.47, 0.40 | **new, labeled** | C2DB and friends catalog thousands of monolayers. the isolated flake is charted; the device around it is not. | MoS₂ 1H monolayer flake (not graphene — avoids duplicating the FET chip channel) |
| **battery cathodes** | 0.46, 0.24 | **new, minor dot** | decades of curated electrochemistry, routine HT-DFT screening. intercalation chemistry has its playbook. | LiCoO₂ layered slab + Li plane — MP (verify id: mp-24850 vs mp-22526) |

### Zone 3 — hard region (crimson) — EXACTLY as-is, holograms pinned

fuel cell components → exploded MEA stack (parametric) · electrolyzer components → MEA variant +
O₂ bubbles (parametric) · FET sensors → chip + probe molecule (parametric) · PFAS
sensing/adsorption materials → **PFOA helical −CF₂− backbone, PubChem CID 9554** (signature) ·
complex nanomaterials → core–shell particle + ligands (parametric).

## C. Crowding & cartography

- **Density as argument**: named gradient 8 > 6 > 5; labeled flat 5:5:5 (legibility ceiling);
  minors + the existing ~150 anonymous dust points carry the population asymmetry. Crowded
  shoreline, thinning foothills, five lonely beacons.
- **Label budget**: guard constant 7.7 px/char verified honest (11.52 px mono, 0.66em advance
  + tracking = 7.60). Worst tour pose (pose 0, polar 0.44) compresses bench to ~4–5 label rows →
  **5 labeled per zone is the ceiling; we ship exactly 5.** Hard ridge at capacity (33-char PFAS
  label grandfathered) — add nothing.
- **Two tiers**: Tier A always-labeled (15). Tier B minors (OQMD, MD17, MatBench, battery
  cathodes): dots; 3D label opacity 0 unless hover-picked (nearest new-pair distance ≥ ~28 px —
  14 px pick radius stays collision-free); clickable like every node.
- **2D minors**: dots only, always (zone-colored, probe-brightened, never labeled, incl. tour
  force-label). Matches the anonymous-dust vocabulary.
- **Mobile 2D** (~358×374): absorbs exactly the +4 new labels (PubChem, AFLOW, zeolites,
  2D materials — row separations verified ≥15 px or disjoint x) + 4 dots; the lit bench zone
  title owns v∈[0.15,0.32], which is precisely what demoted OQMD/MatBench to minors.
- **Examine hierarchy (proposed)**: clicking ANY node enlarges its rotating hologram (owner
  ruling honored); the FULL ceremony (camera flight + dim + big panel) stays exclusive to the
  hard five; bench/disc clicks = info fill + modest ≤2× hologram, no camera flight — the
  stepping-stone framing needs a surface, the summit keeps the spotlight. [Owner may override
  to full ceremony for all.]

## D. Minimal diff shape (deliberate unfreeze — data appends only)

1. `hard-region.js` (~+700 B): append 5 literals to `benchPts`, 3 to `discPts` (minors carry
   `m:1`); two one-line label-guard edits (`&& !bp.m` / `&& !dp.m`); optional minor radius 2.0.
   `hardPts`, sampling, tour, probe, contours untouched.
2. `hard-region-3d.js` (~+750 B): append same 8 to its BENCH/DISC consts (sprites/stems/picking/
   entrance absorb appends automatically; arc anchors head-indexed = safe); one `updateLabels`
   condition for minor-span hover-only opacity. **Requires cap renegotiation → 42 KiB.**
3. `_components.sass`: optional 2–3 lines for a minor-span modifier.
4. All 19 baked structures + captions + bench/disc copy strings live in `hard-region-holo.js` —
   keeps both data-frozen files to pure appends.
5. Re-verify end-to-end: 2D desktop light/dark; ≤480 px phone full tour cycle; click-to-sample +
   hard why-cards; PRM static frame; `__HR_NO_PROBE`/`__HR_DIM` export mode; 3D entrance/tour
   poses (pose 0 must frame the new PubChem origin corner); fullscreen splash; de-collision at
   all four poses.

## E. Credibility audit (audience: professors)

- Additions are deliberately NOT his field; copy says "playbook established / routine / charted,"
  never "solved," never first-person. Legend already scopes "my focus" to the hard zone.
- **Excluded on credibility grounds**: polymers (would undercut the PFAS-membrane hard claim —
  membranes ARE polymeric interfaces); solid electrolytes (interface-dominated — placing them
  mid-zone contradicts the thesis); photocatalysts (practitioners would dispute "solved-ish").
- PubChem copy reuses the KB-verified 123M screening figure; MD17 copy avoids implying RAPIDS
  trains on it (RAPIDS benchmarks dimers).
- Pre-existing flag (not in scope): disc point "alloys" duplicates the zone sub-label
  "alloys · mesoscale frameworks"; if ever touched, change the sub-label, not the point.
- Pinned sources: PubChem CIDs 241, 2519, 2244, 9554; MP mp-149, mp-22862, mp-5229. Verify at
  bake: LiCoO₂ id, AFLOW spinel prototype label.
