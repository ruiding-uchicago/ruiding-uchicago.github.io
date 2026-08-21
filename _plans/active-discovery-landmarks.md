# Active-discovery tier — landmark works (2023–2026), verified

> Literature scout pass, 2026-08-21. Every DOI/arXiv ID below was fetched from the
> Crossref or arXiv API and the returned title/venue/year/first-author matched.
> Reference material for the map's middle tier; nothing here is on the site yet.

## Cross-cutting (strongest evidence — spans most classes)

| Work | ID | Note |
|---|---|---|
| GNoME — Merchant et al., *Nature* 2023 | 10.1038/s41586-023-06735-9 | **Contested**: Cheetham & Seshadri, *Chem. Mater.* 2024 (10.1021/acs.chemmater.4c00643) argue the "new" compounds lack real novelty. Cite for momentum; never quote "2.2M new materials" as a settled count. |
| A-Lab — Szymanski et al., *Nature* 2023 | 10.1038/s41586-023-06734-w | **Contested**: Leeman et al., *PRX Energy* 3, 011002 (2024) (10.1103/PRXEnergy.3.011002) re-analyzed the XRD and dispute that any new material was made. Cite as "the autonomous-lab playbook exists", not as solved synthesis. |
| MatterGen — Zeni et al., *Nature* 2025 | 10.1038/s41586-025-08628-5 | Generative crystal design; one synthesized candidate (TaCr2O6). Largely uncontested. |
| CHGNet — Deng et al., *Nat. Mach. Intell.* 2023 | 10.1038/s42256-023-00716-3 | Universal interatomic potential. |
| MACE-MP-0 — Batatia et al. | arXiv:2401.00096 | Foundation model for atomistic chemistry (preprint — cite the arXiv ID). |
| MatterSim — Yang et al. | arXiv:2405.04967 | Preprint. |
| OMat24 — Barroso-Luque et al. | arXiv:2410.12771 | Dataset + models; preprint. |
| Matbench Discovery — Riebesell et al., *Nat. Mach. Intell.* 2025 | 10.1038/s42256-025-01055-1 | "Established screening playbook", benchmarked. Uncontested. |

## Per class

**Perovskites** — verdict: holds (flagship SDL domain).
- RoboMapper — Wang et al., *Matter* 2023 — 10.1016/j.matt.2023.06.040 — HT robotics + ML → 20% PCE device.
- AlphaFlow — Volk et al., *Nat. Commun.* 2023 — 10.1038/s41467-023-37139-y — RL-driven self-driving fluidic lab.

**MOFs** — verdict: holds for screening/prediction; softer on synthesis.
- MOFTransformer — Kang et al., *Nat. Mach. Intell.* 2023 — 10.1038/s42256-023-00628-2
- Zheng et al. (Yaghi), *JACS* 2023 — 10.1021/jacs.3c05819 — LLM-mined synthesis conditions.
- GHP-MOFassemble — Park et al., *Commun. Chem.* 2024 — 10.1038/s42004-023-01090-2
- MOFDiff — Fu et al. — arXiv:2310.10732 (ICLR 2024)

**Alloys** — verdict: holds; ML delivers composition design, process–microstructure coupling still hard (which supports the site's thesis).
- Rao et al., *Science* 2022 — 10.1126/science.abo4940 — closed-loop AL → experimental Invar HEAs (just outside the 3-year window; the field's anchor).
- Sohail et al., *Nature* 2025 — 10.1038/s41586-025-09160-2 — ML-designed FeNiCoAlTa, experimentally validated.

**Zeolites** — verdict: **weakest of the six**. Playbook exists, but synthesis-outcome prediction ~70% and new *frameworks* still come from serendipity. "half-charted" accurate; "no longer the hard part" is generous.
- ZeoSyn — Pan et al., *ACS Cent. Sci.* 2024 — 10.1021/acscentsci.3c01615 — 23k+ literature-extracted routes.
- ZeoBind — Xie, Schwalbe-Koda et al., *Nat. Comput. Sci.* 2025 — 10.1038/s43588-025-00842-5 — ~500M zeolite–OSDA pairs; two OSDAs experimentally validated.

**2D materials** — verdict: holds, and the site's "flake vs device" line is the expert-consensus position. Keep it verbatim.
- MC2D expansion — Campi et al., *ACS Nano* 2023 — 10.1021/acsnano.2c11510 — ~3,000 exfoliable monolayers charted.
- Autonomous PLD — Harris et al., *Small Methods* 2024 — 10.1002/smtd.202301763 — closed-loop WSe2 growth.

**Battery cathodes** — verdict: holds for materials-level discovery; experimental electrochemistry data still scarce.
- DRXNet — Zhong et al. (Ceder), *Joule* 2024 — 10.1016/j.joule.2024.03.010 — 19k+ experimental discharge profiles.
- Chen et al., *JACS* 2024 — 10.1021/jacs.4c03849 — 32M candidates → synthesized conductor. Caveat: an *electrolyte*, not a cathode.

## If the tier ever needs references, in this order

GNoME · MatterGen · A-Lab (paired with the PRX Energy critique) · Matbench Discovery ·
MACE-MP-0 or CHGNet · RoboMapper · ZeoBind · DRXNet

## Framing checks against the site's current copy

- "mainstream ML-for-materials already delivers here" — safe for perovskites, alloys, MOF screening,
  computational cathodes, 2D flakes. Generous for zeolites and for MOF/oxide *synthesis*.
- The site's argument only needs "the playbook exists and is no longer the frontier", so the framing
  survives — provided it never quotes the contested headline counts.
- The zeolite entry's "templated synthesis is codified" is the one line worth softening.
