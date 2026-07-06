# Proposal: "The Hard Region, Extruded" — a cogitator-hologram 3D terrain for the homepage

> Authored by a Fable-5 design agent after reading the full repo (hard-region.js all 565 lines,
> `hr-` Sass system, Crimson Lab tokens, site.js gating patterns, fluid layer, magos-pet z-index).
> Status: **v2 APPROVED for implementation, 2026-07-06.** v1 architecture (§1, §4–§6, §8) stands
> unchanged; the visual spec is amended by the design review — see "v2 Final Spec — Review
> Amendments" at the bottom, which SUPERSEDES the marked v1 clauses. Owner decision: wheel
> zoom (engage model) is KEPT despite the review's cut recommendation.
> This folder (`_plans/`) is not rendered by Jekyll — internal doc only.

## 0. The one-sentence design

The existing phase diagram stands up: on capable desktops, the flat 2D map boots as usual, then — when scrolled into view — performs a "hololith projection" transition in which the terrain extrudes out of the plane, tilts to a three-quarter view, and becomes an orbitable holographic massif where z-height *is* discovery difficulty, benchmark datasets glitter in the teal lowlands, and Ray's five systems burn as crimson beacons on pylons along the ridge — while every other visitor (mobile, reduced-motion, no-WebGL2, low-power) gets today's 2D map, byte-for-byte unchanged.

The critical semantic insight that makes this honest rather than decorative: **the 2D map's `field(u,v)` function is already a heightfield.** `fbm(...) * (0.28 + 0.92 * hard)` in `/assets/js/hard-region.js:59-62` literally encodes "difficulty terrain" — the contour lines users see today are level sets of it. The 3D version displaces geometry with the *same seeded function* (seed `20260610`, same 7 contour levels), so the 3D object is provably the same map, not new eye candy. The contours on the base plane and the 3D ridge will line up exactly.

---

## 1. Technology choice: hand-rolled WebGL2, single ES module. Not three.js.

**Recommendation: a self-contained ~20 KB hand-written WebGL2 module** (`assets/js/hard-region-3d.js`), dynamically imported. Reasoning:

| Option | Verdict |
|---|---|
| **three.js (vendored ESM + import map)** | Runner-up. `three.module.min.js` is ~680 KB raw (~170 KB gzip) plus OrbitControls as a separate addon module, plus an import map in `default.html`. It buys raycasting and battle-tested controls — but this scene needs *custom shaders anyway* (contour lines, fresnel, scanlines, heightfield displacement all require `ShaderMaterial`), at which point three.js is mostly a matrix library and a render loop. Vendoring 680 KB into the repo to draw one static mesh is against the grain of a site where every other component is proudly dependency-free. |
| **Hand-rolled WebGL2** | **Chosen.** The scene is *one* static indexed heightfield mesh + one base quad + three point-sprite classes + a few lines. No scene graph needed. Needed infrastructure: ~80 lines of mat4 math, ~70 lines of constrained-orbit camera, screen-space node picking (project 11 points, nearest-within-radius — no raycasting required). Total ~600–800 lines, ~7–9 KB gzipped. Crucially, this matches the site's ethos — `hard-region.js` header says "Canvas2D, no dependencies," and the repo already vendors a raw-WebGL fluid sim — and it *is* the credibility statement: view-source shows a hand-built renderer, not a three.js boilerplate demo, which is exactly the anti-AI-slop bar. |
| **CSS 3D** | Rejected. Cannot render a displaced heightfield; would be flat planes in perspective — eye candy, failing constraint 1. |
| **regl / ogl / twgl** | Rejected as a middle path with the worst of both: still a vendored dependency and import plumbing, still hand-written shaders and camera, saves maybe 150 lines. |

**Gate on WebGL2 specifically** (needed for `fwidth`-clean grid shaders without extensions and guaranteed on any hardware we'd want running this); WebGL1-only devices simply keep the 2D map. **Escalation clause:** if hand-rolled orbit controls don't feel buttery after two focused days of tuning, switch to vendored three.js rather than shipping janky controls (see §8).

Note on coexistence: `webgl-fluid.umd.js` already holds a page-wide WebGL context on desktop fine pointers. Two contexts is well within browser limits (~8–16), and the fluid is hover-driven/idle-cheap, but Phase 3 includes profiling them together.

---

## 2. Scene & visual design

### Geometry
- **Heightfield source:** at init, evaluate the ported `field(u,v)` (identical Perlin permutation, identical seed) into a **256×160 `R8` DataTexture**. This one texture drives everything: vertex displacement of the terrain, contour rendering on the base, and zone classification in fragment shaders. Baking in JS (rather than porting Perlin to GLSL) guarantees bit-level agreement with the 2D map.
- **Terrain mesh:** 129×81 indexed grid ≈ 10.4k vertices / 20.5k triangles, displaced in the vertex shader by sampling the texture. Vertical exaggeration ~0.55× of map width so the hard region reads as a massif, not a spike. World layout: x = system complexity, y (depth, away from camera) = data cost, z (up) = difficulty.
- **Base plinth:** a single quad ~0.04 units below terrain zero — the "cogitator projection plate," with a thin beveled rim drawn as lines.

### Materials — "hololith projection," theme-adaptive
Two render passes on the terrain plus a base pass:

1. **Terrain fill (translucent volume):** fragment color blends by the same hardness scalar the 2D map uses (`(u+v)/2` smoothed): `--color-accent-teal` lowlands → `--color-accent` (champagne/gold) midlands → `--color-primary` crimson on the massif. Alpha ~0.16–0.30, depth-write off, so it reads as projected light, not plastic. A **fresnel rim term** (pow(1−N·V, 3)) brightens silhouettes in crimson — the classic hologram edge glow.
2. **Terrain grid overlay:** `fwidth`-based anti-aliased grid lines in UV space (every 1/24th), plus **contour isolines**: `fract(height / level-spacing)` sharpened with `fwidth`, drawn at exactly the seven `LEVELS` from hard-region.js. Lines take zone color; brightness pulses subtly with the same 1.7 s breathing period the 2D glow uses.
3. **Base plate shader:** renders the *flat* contour map (same texture, same levels) in muted border color — so the familiar 2D diagram remains legible on the floor, and each 3D node drops a thin stem line to its base position. This is the readability safety net: perspective never destroys the ability to read x/y coordinates.
4. **Scanline sweep:** a single moving band — `smoothstep` on `abs(worldY − sweep(t))` — brightens contours as it passes, once every ~6 s. Cheap (one uniform), unmistakably cogitator. Frozen under any motion-reduction condition (moot, since PRM users get 2D).

**Light theme is a different rendering philosophy, not a dimmed copy:** dark theme is additive glow on near-black (`#0c0a0a`) — true hololith. Light theme becomes a **"surveyor's blueprint on vellum"**: full-strength maroon `#800000` and teal ink lines at higher alpha, fill alpha near zero, no bloom/glow terms (additive glow on cream reads as smudge), stems and contours as crisp plotted lines. All colors are read from CSS custom properties at init and re-read on the `prefers-color-scheme` media-query change event, exactly as `colors()` does today — uniforms update, no rebuild.

### Nodes and labels
- **Nodes as point sprites** (three `gl.POINTS` draw calls, one per class, shader-drawn shapes): teal circles for `benchPts` (QM9, Materials Project, OC20) sitting low in the plain; champagne rotated-square/diamond sprites for `discPts` (perovskites, MOFs, alloys) on the foothills; crimson pulsing beacons for the five `hardPts` on the heights, each atop a thin GL-line pylon to the base — "auspex arrays planted on the ridge." Twinkle phase per node reuses the 2D `k * 1.7` offset.
- **Labels: HTML overlay, not sprites.** A `.hr3d-labels` layer inside the figure; each label is a positioned `<span>` reusing the existing `.hr-label` / node-label typography (JetBrains Mono, letter-spacing, theme colors for free). Each frame, project node world positions with the MVP matrix, set `transform: translate3d(...)`, fade by depth and hide when near-occluded (compare projected z against a heightfield sample along the view ray — or simply fade labels on the far side of the massif by azimuth, which is cheaper and looks intentional). Crisp text at any DPR, screen-reader-visible, zero texture atlas maintenance.
- **Axes:** GL lines along the two front base edges with tick marks; the axis captions reuse the existing `.hr-axis` HTML elements, repositioned into 3D-projected anchors while 3D is active (the elements themselves are untouched in the 2D fallback). A small "Z: DISCOVERY DIFFICULTY" caption appears on the vertical rim — this is the one genuinely new semantic element, and it should be labeled explicitly.

### The entrance (the money shot)
On first init the camera starts top-down orthographic-feeling (long lens, high polar angle), matching the 2D map's framing, with terrain displacement scaled to 0 — visually indistinguishable from the flat map. Over ~1.6 s (easeOutExpo, the site's house easing): displacement rises 0→1, camera cranes down and around to the default three-quarter hero view, the scan sweep runs once. The map *stands up*. This replaces the 2D intro zoom and is the moment that says "this person builds systems."

---

## 3. Interaction design

- **Constrained orbit, never flips:** spherical camera around the terrain centroid. Azimuth clamped to ±55° around the hero view; polar clamped 18°–68° from horizontal (never under the plate, never fully top-down); dolly radius clamped [0.8×, 1.6×]. Damped inertia (`vel *= 0.9`/frame). Cursor: `grab`/`grabbing`.
- **No scroll hijack:** wheel over the figure scrolls the page normally until the figure is "engaged" (first pointerdown inside it); then wheel dollies, and `Esc` or pointer-leave disengages. A one-line hint ("drag to orbit · scroll to zoom") appears in the `.hr-head` caption slot while engaged. This is non-negotiable for a homepage.
- **Node hover/click:** screen-space pick — nearest projected node within 14 px. Hover brightens the node and its label. Click on a hard node fills the **existing `#hr-info` panel with the existing `why` copy** (same DOM, same styles, zero duplication); click elsewhere drops a sample ripple ring on the terrain surface at the picked (u,v), echoing the 2D click-to-sample.
- **The region tour survives — upgraded to camera choreography:** the same three-zone cadence (3.5 s / 3.5 s / 7 s dwell, hard region longest) now *also* eases the camera between three preset poses: low over the teal lowlands → mid over the discovery foothills → the hero shot gazing up the crimson massif, while toggling the same `.lit` / `hr-hard-active` classes so the `.hr-bullets` reveal still fires. Any pointer interaction pauses the tour for 4 s (same `lastUserT` pattern).
- **Idle drift:** ±6° azimuth sinusoidal drift when idle and not touring — the hologram never sits dead still (dark theme only; the light "blueprint" stays stiller, befitting ink).
- **Touch (Phase 3, capable tablets only):** `touch-action: pan-y` on the canvas; horizontal one-finger drags orbit, vertical pass through to page scroll; two-finger pinch dollies; tap picks nodes. Phones keep 2D regardless.
- **Keyboard:** figure is focusable; arrow keys orbit in steps, Tab cycles the five hard nodes (moving a focus ring sprite + opening `hr-info`), matching the existing `tabindex` affordance on the hard label.

---

## 4. Progressive enhancement architecture

**Principle: `hard-region.js` ships and boots byte-for-byte unchanged, always.** The 2D map is not a fallback that gets swapped in — it is the default that never leaves.

- **Loader** (~40 lines, appended as a second small `defer` script tag in `index.html` after the existing one — the only edit to existing files besides Sass):
  1. Synchronous gates, all cheap: `matchMedia('(prefers-reduced-motion: reduce)')` false; `matchMedia('(pointer: coarse)')` false (Phase 1–2); `canvas.getContext('webgl2')` truthy (probe context released immediately); `navigator.deviceMemory` ≥ 4 *if present* (absent on Safari/Firefox — treat absent as pass); `hardwareConcurrency` ≥ 4; `navigator.connection.saveData` not true; viewport ≥ 720 px. Any failure → loader exits silently; nothing else ever loads.
  2. If gates pass: `IntersectionObserver` on `#hard-region` with `rootMargin: '600px'` → `import('/assets/js/hard-region-3d.js')` (native dynamic import; classic Pages serves `.js` with correct MIME, no bundler needed). Import happens *before* the figure is on screen, so the entrance animation is ready when it arrives.
  3. Module init: create its own `<canvas class="hr3d-canvas">` layered above `#hr-canvas` (z-index 1 inside the figure — far below Vex-7's 9990), compile shaders, upload geometry. **Only after a successful first frame** does it fade in over the 2D canvas (300 ms opacity cross-fade) and begin the stand-up animation.
  4. **Any failure at any point** — import error, shader compile failure, `webglcontextlost` without restore, or a watchdog seeing 3 consecutive seconds under 24 fps — calls one function: remove the 3D canvas and listeners. The 2D map is still live underneath (its own rAF loop, already 30 fps-capped, kept running the whole time) so recovery is instant and glitch-free.
- **Cost of leaving 2D running underneath:** one 30 fps-capped Canvas2D draw on machines that just passed a desktop-GPU gate — i.e., exactly what every visitor pays today. This buys a zero-modification guarantee on `hard-region.js`. If profiling in Phase 3 shows it matters, the *optional* follow-up is a 4-line pause hook in hard-region.js — but it is explicitly not required to ship.
- The HTML zone labels/legend/bullets remain in the DOM in both modes; the 3D module adds an `hr3d-on` class to the figure that Sass uses to reposition/hand over label placement. Removing the class restores 2D layout exactly.

---

## 5. Performance plan

- **Geometry budget:** terrain 10.4k verts / 20.5k tris (one indexed draw); base quad; ~150 line vertices (pylons, axes, rim); 11 point sprites. **Total ≤ 8 draw calls, ~21k triangles** — trivial for anything that passed the gate, comfortable even for Intel UHD iGPUs.
- **DPR cap 1.5** for the 3D canvas (glow-heavy holographic content hides the softness; the 2D map keeps its cap of 2). One further knob: render at 0.75× and upscale via CSS if the fps watchdog trips once before falling back.
- **rAF discipline:** single loop; stops entirely when the figure's IO reports non-intersecting or `document.visibilitychange` hides the tab (same pattern as the 2D `visible` flag); optional 30 fps cap to match the site's cadence — the animations (pulse, sweep, drift) are slow enough that 30 fps is indistinguishable.
- **Memory:** one 256×160 R8 texture (40 KB), ~700 KB of GPU buffers, no framebuffers, no post-processing passes (fresnel/scanlines are inline shader terms, not bloom). Full `dispose()` path on fallback. `webglcontextlost` → `preventDefault`, try one restore, else fall back.
- **CPU per frame:** 11 point projections for labels/picking + uniform updates. Effectively zero.

## 6. Payload plan (no-bundler)

| File | Purpose | Size (raw / gzip est.) |
|---|---|---|
| `assets/js/hard-region-3d.js` | ES module: mat4 math, orbit camera, shaders as template literals, scene, tour, picking | ~22 KB / ~8 KB |
| Loader script tag in `index.html` (or tiny `assets/js/hard-region-3d-boot.js`) | gates + IO + dynamic import + fallback | ~1.5 KB |
| `_sass/_components.sass` additions (`.hr3d-*`) | canvas layering, label overlay, engaged-hint | ~2 KB |
| **Total added** | | **~25 KB raw, ~10 KB gzip — and zero bytes for anyone who fails the gate** |

Nothing vendored, no import map, no changes to `_layouts/default.html`. (For comparison: the three.js route would add ~700 KB to the repo and ~175 KB gzip to gated visitors.)

## 7. Phased build plan (~8–10 focused days total)

- **Phase 1 — Minimum shippable wow (3–4 days):** loader + gating; heightfield texture bake; terrain fill + grid/contour shaders; base plate with projected contours; constrained orbit with damping and no-scroll-hijack; the 11 nodes with pylons; HTML label projection; click → `#hr-info`; theme-reactive uniforms (both themes shippable); fallback path tested by force-failing every gate. *Shippable definition:* a themed, orbitable, semantically faithful 3D map with working node info — even with no entrance animation and no tour, this already clears the "evidence he builds systems" bar.
- **Phase 2 — The hologram (2–3 days):** stand-up entrance transition; fresnel rim; scan sweep; tour camera choreography synced to `.lit`/`hr-hard-active`; idle drift; hover glow + cursor states; engaged-zoom hint; light-theme "blueprint" pass tuned separately from dark.
- **Phase 3 — Hardening (2 days):** fps watchdog + graceful fallback; context-loss handling; keyboard orbit + node Tab-cycling; profiling alongside the fluid layer; optional capable-tablet touch mode; `__HR_NO_PROBE`-style export hooks for GIF captures; cross-browser pass (Safari WebGL2 quirks, Firefox).

## 8. Risks & kill criteria

| Risk | Mitigation | Kill / abort trigger |
|---|---|---|
| Light theme never looks premium (additive holo language fights cream background) | Separate "blueprint" rendering philosophy, tuned independently | If after Phase 2 the light theme still reads as smudged or cheap, ship **3D in dark theme only** (majority of the aesthetic audience), 2D in light; if *both* themes miss the bar → full abort to 2D |
| 3D is less legible than 2D (perspective distorts axis reading, labels occlude) | Base-plate contour map + pylons preserve exact (x,y) readability; explicit z-axis caption | If a fresh viewer can't state what the two axes and the height mean within seconds, the object has failed constraint 1 → abort |
| Hand-rolled orbit feels janky | Damping + hard clamps; small surface area | > 2 days tuning without buttery feel → escalate to vendored three.js (accepting the 175 KB gzip cost) rather than ship jank; if even that pressure-tests badly → abort |
| Perf on gated-but-weak iGPUs | DPR 1.5 → 0.75× render scale → watchdog fallback | Sustained < 30 fps on a mid-2019 Intel iGPU after all knobs → tighten gates; if gates get so tight almost nobody sees it, the feature isn't worth its maintenance → abort |
| Scroll hijack / interaction annoyance | Engage-to-zoom model, `pan-y` on touch | Any reproducible scroll-trap on any browser that can't be fixed in a day → ship without wheel zoom (drag-only) before considering abort |
| Payload/complexity creep | Single-module discipline | Module > 40 KB raw or init > 150 ms on target hardware → cut features until under budget |

The structural bet that de-risks everything: because the 2D map never stops being the default and the 3D layer is a pure additive overlay behind synchronous gates, **every failure mode degrades to exactly today's site.** The worst case of this project is the status quo.

## Critical files for implementation

- `assets/js/hard-region.js` — heightfield `field()`/`fbm()` (lines 19–62), contour `LEVELS` + `buildContours()` segments (reused by the v2 entrance), the auto-survey probe `advanceAuto` state machine (lines 413–441, promoted to 3D in v2), all node data (`benchPts`/`discPts`/`hardPts` with `why` copy, lines 104–140), and the gating/tour patterns to mirror
- `index.html` — the `#hard-region` figure markup (lines 32–60) where the loader tag is added and the 3D canvas mounts
- `_sass/_components.sass` — `hr-` component styles to extend with `.hr3d-*` layering/label classes
- `_sass/_variables.sass` — Crimson Lab CSS custom properties (light `:root` at line 119, dark override at line 179) that shader uniforms must read
- `assets/js/site.js` — the existing `webglOK()`/PRM/COARSE gating pattern (lines 5–40) to stay consistent with, and the coexisting fluid WebGL context to profile against

---

# v2 Final Spec — Review Amendments (SUPERSEDES marked v1 clauses)

> Source: independent design review (Fable-5 art-director agent, 2026-07-06), benchmarking against
> GitHub globe, Stripe gradient work, acko.net/MathBox, Death Stranding odradek scan, W40k
> Mechanicus auspex UI, NASA/Mapbox terrain, TRON figure-ground discipline.
> Review verdict on v1: "Architecture A, visual ambition B-minus." Amendments below raise the
> visual ceiling at a cost of ~3–4 KB gzip and <1 ms/frame — inside all v1 budgets and kill lines.
> Owner ruling: amendment R-CUT-2 (drop wheel zoom) was REJECTED; wheel zoom stays.

## A. Signature entrance — "THE CONTOURS LIFT" (replaces v1 §2 "The entrance")

The v1 stand-up (displacement 0→1 + camera crane) is the stock reveal of the genre. Replaced by
an entrance derived from this dataset's own structure (the §0 insight, now *performed*):

1. Visitor sees the familiar flat 2D map (the live 2D canvas underneath — no imitation needed).
2. On trigger, the **seven contour level-sets detach from the page**: each level's segment loops
   (reuse the exact polylines from `buildContours()`, `LEVELS = [0.26 … 0.86]`) rise to their true
   height as GL lines with an animated per-level z uniform. Staggered lowest-first, ~90 ms apart,
   ~1.2 s total, house easeOutExpo. For one beat the map is a floating stack of glowing isoline
   laminae — a hololith table made of *this* data.
3. As the top (crimson) ring locks in, the terrain **skins across the rings**: a clip-height
   uniform sweeps from the teal lowlands up-slope; the hillshaded surface materializes behind it
   with a single scan band riding the clip edge (the ONLY scan sweep in the ambient piece).
4. Camera cranes to the 3/4 hero pose DURING the skin, not before.
5. Beacons ignite last, in sequence along the ridge, each stamping its mono label.

Total ~2.6 s, one-shot. Describable in one sentence: "the contour lines float up off the page and
become a mountain." Cost over v1 entrance: ~1.5 KB (segments already computed in JS).

## B. Material amendments (fixes "translucent jelly" risk in v1 §2)

- **B1. Hillshade lighting — MANDATORY, Phase 1.** Central-difference normals from the 256×160
  heightfield texture + one analytic directional lambert term over the hypsometric ramp.
  ~15 shader lines, 0 KB. This is the difference between terrain and jelly; v1 had no lighting
  model at all.
- **B2. Interleaved-gradient-noise dither** on all fills/gradients, 3 shader lines. Stripe-grade
  banding hygiene on the near-black theme. Phase 1.
- **B3. Height fog at the plinth:** `exp(−h·k)` darkening near the base for grounding/depth
  cueing. 2 shader lines. Phase 1.
- **B4. Slope-aware contour weighting:** thicken/brighten contour lines where slope is steep
  (normals free from B1). 2 lines. Phase 1.
- **B5. Grid overlay demoted:** the 1/24 UV grid is CUT from the terrain mesh (it was the fourth
  line system on one surface). Grid lives on the base plate only.
- **B6. Ambient oscillators cut:** the 6 s ambient scanline sweep and the contour breathing pulse
  are CUT. Scan bands appear only as *events* (entrance skin, probe ping, click-scan). Node
  twinkle stays (inherited 2D vocabulary). Nothing oscillates faster than ~1.5 s.
- **B7. Beacon light-cones (optional, Phase 2):** billboarded gradient triangle per hard beacon
  instead of a bare pylon line, alpha ≤ 0.08. Cheese risk — keep whisper-faint or cut on sight.

## C. Idle & interaction amendments (fixes "dead idle" in v1 §3)

- **C1. Idle camera drift (±6°) is CUT.** Restless motion with zero meaning; fights label reading.
- **C2. The auto-survey probe is PROMOTED to 3D — Phase 1.** The most characterful artifact on the
  2D map (`advanceAuto` reticle + live readout) survives: the reticle crawls the *terrain surface*
  (sample heightfield at its (u,v)), projects a thin vertical scan-column of light, and an HTML
  overlay shows live `CX · COST · DIFF` in JetBrains Mono, with an occasional ping ripple. Reuses
  the `advanceAuto` state machine nearly verbatim. ~1 KB. This is the idle life of the piece.
- **C3. Odradek click-scan — THE interactive verb, Phase 1.** Click terrain → an expanding ring
  that *conforms to the heightfield* (fragment: smoothstep band on uv-distance from click; uniform
  array supports 3–4 concurrent scans); contours flare white-hot inside the band; a coordinate
  readout stamps at the sample point. ~30 shader lines + uniforms. Supersedes the v1 flat "ripple
  ring" — do not build both.
- **C4. Wheel zoom KEPT (owner decision, overrides review).** The v1 engage model ships as
  specced: wheel scrolls the page until first pointerdown inside the figure engages it; then wheel
  dollies; Esc / pointer-leave disengages; hint text in `.hr-head` while engaged. Drag-only remains
  the documented fallback if a scroll-trap bug survives more than a day (v1 §8 risk table).
- **C5. Expedition arcs — Phase 2.** 2–3 dashed polylines draped over the heightfield, ascending
  from the benchmark lowlands (QM9 / Materials Project) to two hard-region beacons; dash pattern
  marches upward (`fract(t·speed − u)`), champagne→crimson along the path. Precompute the drape in
  JS. ~1 KB. The GitHub-globe move: motion that argues the thesis ("routes into the hard region").
- **C6. Tablet touch mode (v1 Phase 3) is CUT.** Audience is professors on laptops. Phones/tablets
  keep the 2D map.
- **C7. Arrow-key orbit is CUT; Tab-cycling of the five hard nodes STAYS** (real a11y value:
  focus ring sprite + `#hr-info` opening).

## D. Taste guardrails (binding for all phases)

One rule: **a cogitator displays measurements; a cheesy hologram displays effects.** Every photon
must be attributable to data.

DO: all text JetBrains Mono / uppercase / tracked; every displayed number is a real `field(u,v)`
value or node coordinate; scan bands only as events; exactly the three token hues + neutrals;
**crimson reserved exclusively for the hard region and beacons**; glow via geometry only (fresnel,
additive line blending, gradient billboards); light theme = zero glow, opaque plotted ink
("blueprint on vellum"); stillness as confidence — camera moves only when the user or tour moves it.

DON'T: no chromatic aberration, RGB-split glitch, CRT distortion, film grain, lens flares, or post
bloom (each is the first checkbox of AI-slop sci-fi); no persistent screen-space scanlines (TV
effect, not an instrument); no decorative fake numbers, hex-dump tickers, or "SYSTEM ONLINE" boot
text (fake telemetry reads as marketing); no spinning-for-no-reason.

## E. Revised phase contents (effort unchanged: ~8–10 days; cuts pay for upgrades)

- **Phase 1 — Minimum shippable wow (3–4 days):** v1 Phase 1 skeleton (loader/gating, heightfield
  bake, constrained orbit + engage wheel-zoom, nodes/pylons, HTML labels, click→`#hr-info`,
  theme-reactive uniforms, forced-fallback tests) PLUS B1 hillshade, B2 dither, B3 fog, B4 slope
  contours, C2 probe-in-3D, C3 odradek click-scan. MINUS terrain grid, ambient sweep, contour
  pulse, idle drift.
- **Phase 2 — The hologram (2–3 days):** A. contour-lift entrance (replaces stand-up), fresnel rim,
  tour camera choreography synced to `.lit`/`hr-hard-active`, hover glow + cursor states,
  engaged-zoom hint polish, light-theme blueprint tuning, C5 expedition arcs, B7 light-cones
  (audition, cut if cheesy).
- **Phase 3 — Hardening (2 days):** fps watchdog + graceful fallback, context-loss handling,
  Tab-cycling a11y, profiling alongside the fluid layer, `__HR_NO_PROBE`-style export hooks for
  GIF captures, cross-browser pass (Safari WebGL2 quirks, Firefox). (Tablet touch removed.)

## F. Additional kill criterion

If the contour-lift entrance cannot be made to read clearly (rings too thin / too busy at figure
size) within one focused day, fall back to the v1 stand-up entrance rather than shipping a
confusing signature moment — but keep B/C/D amendments regardless.
