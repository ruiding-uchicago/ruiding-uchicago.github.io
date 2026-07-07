# Proposal: "Strategium Holograms" — per-node holographic projections on the hard-region map

> Status: **IMPLEMENTED LOCALLY, 2026-07-06** — roster expansion (R), bake pipeline + small
> holograms (H1), and tiered examine mode (H2) all shipped to the working tree and judged PASS;
> awaiting owner preview before commit. Artifacts: tools/bake_structures.py,
> assets/js/hr-holo-data.js (generated, 4,290 B), assets/js/hard-region-holo.js (14,258 B),
> main module 43,005/43,008 B, hard-region.js = roster appends only.
> Original goal record below.
> Parent: [[hard-region-3d-proposal.md]] — all its taste guardrails and constraints carry over.
> `_plans/` is not rendered by Jekyll — internal doc only.

## The goal (owner's words, condensed)

Every point on the 3D map gets a **floating holographic projection** above it — Warhammer-40k
command-table ("strategium / hololith table") grammar. **Click a node → the hologram enlarges,
keeps rotating, with accompanying text.** The map becomes a command table over the research
territory.

## Why this passes the taste bar

Guardrail: *every photon attributable to data.* These 11+ nodes are all entities with **real 3D
structures** — the hologram is not decoration, it projects the actual object of study:

| Node | Hologram | Structure source |
|---|---|---|
| QM9 | small organic molecule, ball-and-stick (benzene/methanol) | PubChem 3D SDF, real coordinates |
| Materials Project | crystal unit cell (rock-salt / FCC) | Materials Project CIF |
| OC20 | catalyst slab + adsorbate | OC20-style configuration |
| perovskites | ABX₃ cubic cell + octahedra | CaTiO₃ real cell |
| MOFs | metal nodes + organic linkers cage | MOF-5 topology, simplified |
| alloys | multi-element random-occupancy FCC lattice | parametric |
| fuel cell / electrolyzer components | layered MEA stack (membrane/CL/GDL), exploded | parametric geometry |
| FET sensors | chip: source/drain/channel/gate + probe molecule | parametric |
| PFAS sensing/adsorption | **PFOA with helical −CF₂− backbone** approaching an interface | PubChem — the owner's signature system |
| complex nanomaterials | core–shell / heterostructure hierarchical particle | parametric |

Chemists recognize these on sight; that recognition IS the credibility play.

## Asset pipeline — NO 3D modeling software

Blender/glTF explicitly rejected (runtime parser = three.js problem again; KB bloat; hand-modeled
"holo trinkets" = plastic risk). Instead:

```
PubChem SDF / Materials Project CIF
  → ~50-line Python baker (RDKit / pymatgen), lives in tools/, not shipped
  → quantized compact JS arrays (20–80 atoms each, a few hundred bytes/structure)
  → procedural geometry at runtime: atoms = existing point-sprite shader,
    bonds/frames = existing line program, + one additive "hololith" pass
```

## Interaction ladder (approved)

| State | Trigger | Behavior |
|---|---|---|
| idle | tour/probe passes | small hologram rotates quietly above the node |
| scan | hover | that node's hologram brightens + cursor readout |
| **examine** | **click ANY node — the hard beacons AND the small bench/disc dots alike** (owner ruling 2026-07-06) | camera eases toward the node (reuse tour-pose easing); hologram **scales 3–4×** above the pylon/dot, keeps slow rotation, base ring — W40k hololith table × **StarCraft unit-selection portrait** grammar: selected unit's structure spins in monochrome projected light; terrain + other nodes dim slightly (2D dimOther precedent, one uniform); `#hr-info` expands to an examine variant with per-node copy **plus one structure caption line of real data** — e.g. `PFOA · C₈HF₁₅O₂ · helical −CF₂− backbone`, `CaTiO₃ · Pm3̄m` |
| exit | Esc / click-away / another node | hologram shrinks back, camera returns |

Examine text for bench/disc nodes: the one-line copy being authored in the roster spec (open
question 1) doubles as their examine text — every node the roster ships must therefore carry
copy + a structure caption, not just the hard five.

Spawn/despawn with 2–3-frame hololith flicker. Monochrome projections in the node's zone hue
(teal/champagne/crimson) — command-table light is monochrome; element identity via size/brightness,
NOT CPK colors. Light theme: enlarged plotted-ink "blueprint figurines," zero glow, same text.

## Architecture

- **Separate lazily-loaded module** `assets/js/hard-region-holo.js` (est. ~12–16 KB raw incl.
  baked structures + examine mode, ~5 KB gzip). The main 3D module's byte cap (41,088) is
  effectively full (41,018) — holograms live in their own hull, imported by/after the main module,
  **fully severable**: if it fails, the map is untouched.
- Perf: all structures combined < 1,000 sprite points + < 1,500 line segments, +2–3 draw calls.
- Gating identical to the 3D module; phones/2D never load it.

## Open questions → feeding specs

1. **Point roster & cartography** — **DRAFTED: see [[hard-region-roster-spec.md]]** (19 named
   points, two-tier labeling, crowding math, minimal-diff plan, credibility audit). Awaiting
   owner approval of: the roster itself; the deliberate hard-region.js unfreeze (data appends
   only); the 3D cap renegotiation to 42 KiB; and the examine-hierarchy proposal (full ceremony
   for the hard five vs everyone). Original brief: which points exist per zone; whether
   the benchmark-rich and active-discovery zones gain MORE points (other materials/systems) so the
   density gradient itself argues the thesis (crowded data-rich lowlands vs sparse hard summit);
   per-point one-line copy in the site's voice framing mid-zone systems (MOFs etc.) as tractable
   stepping stones — *"these are no longer the hard part"* — to sharpen the hard region's claim.
   Must respect: label collision budget, mobile 2D map crowding, and the fact that roster changes
   touch the shared node data (a deliberate, careful content edit to hard-region.js — the
   byte-for-byte freeze was a build-time guarantee for the 3D overlay project, and any content
   change must re-verify the 2D map end-to-end).
2. Render/interaction spec for the hologram module (after roster is settled).
3. ~~Whether bench/disc nodes get examine mode too~~ — **RESOLVED (owner, 2026-07-06): yes.**
   Clicking any node, including the small bench/disc dots, triggers the enlarged rotating
   hologram (W40k / StarCraft selection grammar). Consequence for the roster spec: every shipped
   point needs examine copy + a structure caption; unlabeled "minor" dots must still be clickable
   with a sane hit radius.

## Effort estimate

3–4 focused days through the implement→judge→fix loop (roster spec → bake pipeline → small-holo
pass → examine mode → both-themes polish).
